"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { serverApiPatch } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import type { OrderDoc, OrderStatus } from "../types/order-admin.types";

export async function updateOrderStatusAction(payload: {
  orderId: string;
  status: OrderStatus;
  reason?: string;
}): Promise<{ success: boolean; message: string; data?: OrderDoc }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { orderId, status, reason } = payload;

  try {
    const res = await serverApiPatch<{
      success: boolean;
      message: string;
      data: OrderDoc;
    }>(`/orders/${encodeURIComponent(orderId)}/status`, {
      status,
      reason: reason || `Status updated to ${status}`,
    });

    try {
      revalidateTag("orders", "default");
      revalidatePath("/[locale]/admin/orders", "page");
      revalidatePath(`/[locale]/admin/orders/${orderId}`, "page");
    } catch {}

    return res;
  } catch (error: any) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update order status in backend");
    }
    throw new Error(error.message || "Failed to update order status");
  }
}
