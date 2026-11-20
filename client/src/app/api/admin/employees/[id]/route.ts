import { serverApiGet, serverApiPatch } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission, validateEmployeeMutation } from "@/lib/permissions/server-authorization";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { updateEmployeeSchema } from "@/features/employees/schemas/employee.schema";
import type { SingleEmployeeResponse } from "@/features/employees/types/employee.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const authorization = assertSessionPermission(session, PERMISSIONS.EMPLOYEES_VIEW);

  if (!authorization.authorized) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const response = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText, message: error.messageText },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee details" },
      { status: 502 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  if (!session) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateEmployeeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: "Validation error", errors: parseResult.error.flatten() },
      { status: 422 }
    );
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
    return NextResponse.json({ success: false, error: "No fields provided to update" }, { status: 400 });
  }

  // Validate that user holds permission for each update category:
  if (
    hasGeneralUpdates &&
    !can(session.user.role, PERMISSIONS.EMPLOYEES_UPDATE, session.user.permissions)
  ) {
    return NextResponse.json(
      { success: false, error: "You do not have permission to update employee details." },
      { status: 403 }
    );
  }

  if (
    hasRoleUpdates &&
    !can(session.user.role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES, session.user.permissions)
  ) {
    return NextResponse.json(
      { success: false, error: "You do not have permission to manage employee roles and permissions." },
      { status: 403 }
    );
  }

  if (
    hasStatusUpdates &&
    !can(session.user.role, PERMISSIONS.EMPLOYEES_TOGGLE_STATUS, session.user.permissions)
  ) {
    return NextResponse.json(
      { success: false, error: "You do not have permission to activate or deactivate employees." },
      { status: 403 }
    );
  }

  // Retrieve current target employee state to validate authorization restrictions
  let targetEmployee: SingleEmployeeResponse["data"];
  try {
    const targetRes = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
    );
    targetEmployee = targetRes.data;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Failed to inspect target employee" }, { status: 502 });
  }

  // Validate security constraints (privilege escalation, self-lockout, etc.)
  const validation = validateEmployeeMutation({
    actingUser: session!.user,
    targetUserId: id,
    targetUserRole: targetEmployee.role,
    newRole: validatedData.role,
    newPermissions: validatedData.permissions,
    isStatusToggle: validatedData.isActive !== undefined,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.message, message: validation.message },
      { status: validation.statusCode || 403 }
    );
  }

  try {
    const response = await serverApiPatch<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`,
      validatedData
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText, message: error.messageText, errors: error.errors },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update employee in backend service" },
      { status: 502 }
    );
  }
}
