"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import { getErrorMessage } from "@/shared/lib/utils/get-error-message";
import type { CheckoutPayload, PlacedOrder } from "../types/checkout";

export async function checkoutAction(
  payload: CheckoutPayload & {
    couponCode?: string;
    couponDiscount?: number;
    pricing?: {
      subtotal: number;
      couponDiscount: number;
      shippingFee: number;
      totalAmount: number;
    };
  }
): Promise<{ success: boolean; message: string; data?: PlacedOrder }> {
  const token = await getNextAuthToken();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const currentOrigin = `${proto}://${host}`;

  const body: any = {
    ...payload,
    origin: payload.origin || currentOrigin,
    returnUrl: payload.returnUrl || `${currentOrigin}/ar/checkout`,
  };

  if (token?.id || token?.sub) {
    body.userId = token.id || token.sub;
  }

  try {
    const res = await fetch(`${API_URL}/orders/checkout`, {
      method: "POST",
      headers: {
        ...HEADERS.JsonBody,
        ...(token?.token ? HEADERS.authorize(token.token) : {}),
        origin: currentOrigin,
        referer: currentOrigin,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const isSuccess = data?.success ?? data?.status;

    if (!isSuccess) {
      return {
        success: false,
        message: getErrorMessage(data?.message || data?.error, "Checkout failed"),
      };
    }

    try {
      revalidateTag("orders", "default");
      revalidatePath("/[locale]/orders", "page");
      revalidatePath("/[locale]/account/orders", "page");
      revalidatePath("/[locale]/admin/orders", "page");
    } catch {}

    return {
      success: true,
      message: data.message || "Order placed successfully",
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to complete checkout"),
    };
  }
}

// Rose-App and backwards compatibility alias
export async function createOrderAction(
  payload: Parameters<typeof checkoutAction>[0]
) {
  return checkoutAction(payload);
}
