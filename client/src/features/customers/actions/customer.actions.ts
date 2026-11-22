"use server";

import { getServerSession } from "@/auth";
import { serverApiPatch } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { updateCustomerSchema } from "../schemas/customer.schema";
import type {
  SingleCustomerResponse,
  UpdateCustomerPayload,
} from "../types/customer.types";

export async function updateCustomerAction(
  id: string,
  payload: UpdateCustomerPayload
): Promise<SingleCustomerResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.CUSTOMERS_UPDATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Customer ID is required");
  }

  // Validation
  const parseResult = updateCustomerSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  const validatedData = parseResult.data;

  // Execution
  try {
    const response = await serverApiPatch<SingleCustomerResponse>(
      `/customers/${encodeURIComponent(id)}` as `/${string}`,
      validatedData
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update customer");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to update customer in backend service");
  }
}
