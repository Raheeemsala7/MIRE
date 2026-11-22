"use server";

import { getServerSession } from "@/auth";
import { serverApiPost, serverApiPatch } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  requestReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  logCallAttemptSchema,
  assignReturnSchema,
} from "../schemas/return.schema";
import type {
  RequestReturnPayload,
  UpdateReturnStatusPayload,
  InspectReturnPayload,
  LogCallAttemptPayload,
  AssignReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";

export async function submitReturnRequestAction(
  payload: RequestReturnPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Authentication required");
  }

  // Validation
  const parseResult = requestReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      "/returns/request",
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to submit return request");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to submit return request in backend service");
  }
}

export async function updateReturnStatusAction(
  id: string,
  payload: UpdateReturnStatusPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_UPDATE_STATUS
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = updateReturnStatusSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPatch<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/status` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update return status");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to update return status in backend service");
  }
}

export async function inspectReturnAction(
  id: string,
  payload: InspectReturnPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_INSPECT
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = inspectReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/inspect` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to inspect return");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to inspect return in backend service");
  }
}

export async function logCallAttemptAction(
  id: string,
  payload: LogCallAttemptPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_LOG_CALL
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = logCallAttemptSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/call-attempt` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to log call attempt");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to log call attempt in backend service");
  }
}

export async function assignReturnAction(
  id: string,
  payload: AssignReturnPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_ASSIGN
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = assignReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPatch<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/assign` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to assign return");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to assign return in backend service");
  }
}
