"use server";

import { trackOrderApi, getCustomerOrderByIdApi } from "./order.api";
import type { OrderDisplay } from "../types/order";

export async function searchCustomerOrderAction(
  orderIdOrNumber: string
): Promise<{ success: boolean; data?: OrderDisplay; error?: string }> {
  try {
    const cleanQuery = (orderIdOrNumber || "").trim();
    if (!cleanQuery) {
      return { success: false, error: "رقم الطلب مطلوب" };
    }

    const order = await getCustomerOrderByIdApi(cleanQuery);
    if (!order) {
      return {
        success: false,
        error: "لم يتم العثور على طلب بهذا الرقم في حسابكِ، يرجى التأكد من صحة الرقم والمحاولة مجدداً",
      };
    }
    return { success: true, data: order };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "تعذر البحث عن الطلب حالياً",
    };
  }
}

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
