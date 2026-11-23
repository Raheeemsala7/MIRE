"use server";

import { getServerSession } from "@/auth";
import { trackOrderApi, getCustomerOrderByIdApi } from "./order.api";
import { isOrderOwnedByUser } from "../utils/order-ownership.util";
import type { OrderDisplay } from "../types/order";

export async function searchCustomerOrderAction(
  orderIdOrNumber: string
): Promise<{ success: boolean; data?: OrderDisplay; error?: string }> {
  try {
    const cleanQuery = (orderIdOrNumber || "").trim();
    if (!cleanQuery) {
      return { success: false, error: "رقم الطلب مطلوب" };
    }

    const session = await getServerSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "يجب تسجيل الدخول للبحث عن الطلبات في حسابكِ",
      };
    }

    const order = await getCustomerOrderByIdApi(cleanQuery);
    if (!order || !isOrderOwnedByUser(order, session.user.id, session.user.role)) {
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

    // Mask sensitive PII for unauthenticated public tracking responses
    const sanitizedOrder: OrderDisplay = {
      ...order,
      customerInfo: order.customerInfo
        ? {
            fullName: order.customerInfo.fullName,
            phone: order.customerInfo.phone
              ? order.customerInfo.phone.slice(0, 5) + "****" + order.customerInfo.phone.slice(-3)
              : "",
            email: undefined,
          }
        : undefined,
      shippingAddress: order.shippingAddress
        ? {
            city: order.shippingAddress.city,
            governorate: order.shippingAddress.governorate,
            street: "—",
            building: undefined,
            apartment: undefined,
            landmark: undefined,
            latitude: undefined,
            longitude: undefined,
          }
        : undefined,
    };

    return { success: true, data: sanitizedOrder };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "تعذر الاتصال بخدمة التتبع حالياً",
    };
  }
}
