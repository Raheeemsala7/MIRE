"use server";

import { auth } from "@/auth";
import { serverApiGet, serverApiPost, serverApiPatch } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import {
  assertSessionPermission,
  validateEmployeeMutation,
} from "@/lib/permissions/server-authorization";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import type {
  CreateEmployeePayload,
  UpdateEmployeePayload,
  SingleEmployeeResponse,
} from "../types/employee.types";

export async function createEmployeeAction(
  payload: CreateEmployeePayload
): Promise<SingleEmployeeResponse> {
  // Authorization
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.EMPLOYEES_CREATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  // Validation
  const parseResult = createEmployeeSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const validatedData = parseResult.data;

  // Security checks
  const validation = validateEmployeeMutation({
    actingUser: session!.user,
    newRole: validatedData.role,
    newPermissions: validatedData.permissions,
  });

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // Execution
  try {
    const response = await serverApiPost<SingleEmployeeResponse>(
      "/employees",
      validatedData
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to create employee");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to create employee in backend service");
  }
}

export async function updateEmployeeAction(
  id: string,
  payload: UpdateEmployeePayload
): Promise<SingleEmployeeResponse> {
  // Authorization
  const session = await auth();
  if (!session?.user) {
    throw new Error("Authentication required");
  }

  if (!id) {
    throw new Error("Employee ID is required");
  }

  // Validation
  const parseResult = updateEmployeeSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const validatedData = parseResult.data;

  const hasGeneralUpdates =
    validatedData.name !== undefined ||
    validatedData.phone !== undefined ||
    validatedData.password !== undefined;
  const hasRoleUpdates =
    validatedData.role !== undefined ||
    validatedData.permissions !== undefined;
  const hasStatusUpdates = validatedData.isActive !== undefined;

  if (!hasGeneralUpdates && !hasRoleUpdates && !hasStatusUpdates) {
    throw new Error("No fields provided to update");
  }

  if (
    hasGeneralUpdates &&
    !can(
      session.user.role,
      PERMISSIONS.EMPLOYEES_UPDATE,
      session.user.permissions
    )
  ) {
    throw new Error("You do not have permission to update employee details.");
  }

  if (
    hasRoleUpdates &&
    !can(
      session.user.role,
      PERMISSIONS.EMPLOYEES_MANAGE_ROLES,
      session.user.permissions
    )
  ) {
    throw new Error(
      "You do not have permission to manage employee roles and permissions."
    );
  }

  if (
    hasStatusUpdates &&
    !can(
      session.user.role,
      PERMISSIONS.EMPLOYEES_TOGGLE_STATUS,
      session.user.permissions
    )
  ) {
    throw new Error(
      "You do not have permission to change employee active status."
    );
  }

  // Pre-fetch target employee to enforce RBAC and modification constraints
  let targetEmployee: SingleEmployeeResponse["data"];
  try {
    const targetRes = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
    );
    targetEmployee = targetRes.data;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      throw new Error("Employee not found");
    }
    throw new Error("Failed to inspect target employee status");
  }

  const validation = validateEmployeeMutation({
    actingUser: session.user,
    targetUserId: id,
    targetUserRole: targetEmployee.role,
    newRole: validatedData.role,
    newPermissions: validatedData.permissions,
    isStatusToggle: hasStatusUpdates,
  });

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // Execution
  try {
    const response = await serverApiPatch<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`,
      validatedData
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update employee");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to update employee in backend service");
  }
}

export async function toggleEmployeeStatusAction(
  id: string
): Promise<SingleEmployeeResponse> {
  // Authorization
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.EMPLOYEES_TOGGLE_STATUS
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Employee ID is required");
  }

  // Pre-fetch target employee
  let targetEmployee: SingleEmployeeResponse["data"];
  try {
    const targetRes = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
    );
    targetEmployee = targetRes.data;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      throw new Error("Employee not found");
    }
    throw new Error("Failed to inspect target employee status");
  }

  // Security checks
  const validation = validateEmployeeMutation({
    actingUser: session!.user,
    targetUserId: id,
    targetUserRole: targetEmployee.role,
    isStatusToggle: true,
  });

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // Execution
  try {
    const response = await serverApiPatch<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}/toggle-status` as `/${string}`,
      {}
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to toggle employee status");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to toggle employee status in backend service");
  }
}
