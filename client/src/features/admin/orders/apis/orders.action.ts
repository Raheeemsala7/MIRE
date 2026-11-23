"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { RESPONSES } from "@/shared/constant/api.responses";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import { getErrorMessage } from "@/shared/lib/utils/get-error-message";
import type { OrderDoc, OrderStatus } from "../types/order-admin.types";

export async function updateOrderStatusAction(payload: {
  orderId: string;
  status: OrderStatus;
  reason?: string;
}): Promise<{ success: boolean; message: string; data?: OrderDoc }> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    return RESPONSES.unauthorizedS;
  }

  const { orderId, status, reason } = payload;

  try {
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      body: JSON.stringify({
        status,
        reason: reason || `Status updated to ${status}`,
      }),
    });

    const data = await res.json();
    const isSuccess = data?.success ?? data?.status;

    if (!isSuccess) {
      return {
        success: false,
        message: getErrorMessage(data?.message || data?.error, "Failed to update order status"),
      };
    }

    try {
      revalidateTag("orders", "default");
      revalidatePath("/[locale]/admin/orders", "page");
      revalidatePath(`/[locale]/admin/orders/${orderId}`, "page");
      revalidatePath("/[locale]/orders", "page");
      revalidatePath("/[locale]/account/orders", "page");
    } catch {}

    return {
      success: true,
      message: data.message || "Order status updated successfully",
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to update order status"),
    };
  }
}
