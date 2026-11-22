"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "@/auth";
import { serverApiPost } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { adjustStockSchema } from "../schemas/inventory.schema";
import type {
  AdjustStockPayload,
  AdjustStockResponse,
} from "../types/inventory.types";

/**
 * Server Action: Manually adjust stock for a product variant with an audit trail
 */
export async function adjustStockAction(
  payload: AdjustStockPayload
): Promise<AdjustStockResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.INVENTORY_ADJUST
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized to adjust stock");
  }

  // Validation
  const parseResult = adjustStockSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPost<AdjustStockResponse>(
      "/inventory/adjust",
      parseResult.data
    );

    // Cache Revalidation
    try {
      revalidateTag("inventory", "default");
      revalidateTag("products", "default");
      revalidatePath("/[locale]/admin/inventory", "page");
      revalidatePath("/[locale]/admin/products", "page");
      if (payload.productId) {
        revalidatePath(`/[locale]/admin/products/${payload.productId}`, "page");
      }
    } catch {
      // Revalidation errors should not fail the user's successful adjustment
    }

    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to adjust stock");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to adjust stock due to unexpected server error");
  }
}
