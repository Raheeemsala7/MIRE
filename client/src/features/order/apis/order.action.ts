"use server";

import { trackOrderApi } from "./order.api";
import type { OrderDisplay } from "../types/order";

export async function trackPublicOrderAction(
  orderNumber: string
): Promise<{ success: boolean; data?: OrderDisplay; error?: string }> {
  try {
    const order = await trackOrderApi(orderNumber);
    if (!order) {
      return {
        success: false,
        error: "لم يتم العثور على طلب بهذا الرقم، يرجى التأكد والمحاولة مجدداً",
      };
    }
    return { success: true, data: order };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "تعذر الاتصال بخدمة التتبع حالياً",
    };
  }
}
