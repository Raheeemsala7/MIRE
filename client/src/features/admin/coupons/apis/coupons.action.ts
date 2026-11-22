"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { RESPONSES } from "@/shared/constant/api.responses";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import { getErrorMessage } from "@/shared/lib/utils/get-error-message";
import type {
  CouponItem,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponResult,
} from "../types/coupon.types";

export async function createCouponAction(
  input: CreateCouponInput
): Promise<{ success: boolean; message: string; data?: CouponItem }> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    return RESPONSES.unauthorizedS;
  }

  try {
    const res = await fetch(`${API_URL}/coupons`, {
      method: "POST",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      body: JSON.stringify({
        code: input.code.trim().toUpperCase(),
        discountType: input.discountType,
        discountValue: Number(input.discountValue),
        minOrderAmount: input.minOrderAmount ? Number(input.minOrderAmount) : 0,
        maxDiscountAmount: input.maxDiscountAmount ? Number(input.maxDiscountAmount) : undefined,
        startDate: input.startDate || new Date().toISOString(),
        endDate: input.endDate,
        usageLimit: input.usageLimit ? Number(input.usageLimit) : undefined,
        perUserLimit: input.perUserLimit ? Number(input.perUserLimit) : 1,
        description: input.description?.trim() || undefined,
        freeShipping: input.discountType === "FREE_SHIPPING",
      }),
    });

    const data = await res.json();
    const isSuccess = data?.success ?? data?.status;

    if (!isSuccess) {
      return {
        success: false,
        message: getErrorMessage(data?.message || data?.error, "فشل إنشاء الكوبون"),
      };
    }

    try {
      revalidateTag("coupons", "default");
      revalidatePath("/[locale]/admin/coupons", "page");
    } catch {}

    return {
      success: true,
      message: data.message || "تم إنشاء الكوبون بنجاح",
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "حدث خطأ أثناء إنشاء الكوبون"),
    };
  }
}

export async function updateCouponAction(
  id: string,
  input: UpdateCouponInput
): Promise<{ success: boolean; message: string; data?: CouponItem }> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    return RESPONSES.unauthorizedS;
  }

  try {
    const res = await fetch(`${API_URL}/coupons/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      body: JSON.stringify(input),
    });

    const data = await res.json();
    const isSuccess = data?.success ?? data?.status;

    if (!isSuccess) {
      return {
        success: false,
        message: getErrorMessage(data?.message || data?.error, "فشل تعديل الكوبون"),
      };
    }

    try {
      revalidateTag("coupons", "default");
      revalidatePath("/[locale]/admin/coupons", "page");
    } catch {}

    return {
      success: true,
      message: data.message || "تم تعديل الكوبون بنجاح",
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "حدث خطأ أثناء تعديل الكوبون"),
    };
  }
}

export async function deleteCouponAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    return RESPONSES.unauthorizedS;
  }

  try {
    const res = await fetch(`${API_URL}/coupons/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
    });

    const data = await res.json();
    const isSuccess = data?.success ?? data?.status;

    if (!isSuccess) {
      return {
        success: false,
        message: getErrorMessage(data?.message || data?.error, "فشل حذف الكوبون"),
      };
    }

    try {
      revalidateTag("coupons", "default");
      revalidatePath("/[locale]/admin/coupons", "page");
    } catch {}

    return {
      success: true,
      message: data?.message || "تم حذف الكوبون بنجاح",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "حدث خطأ أثناء حذف الكوبون"),
    };
  }
}

export async function validateCouponAction(
  code: string,
  subtotal: number,
  categoryIds?: string[]
): Promise<ValidateCouponResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: "يرجى إدخال كود الكوبون" };
  }

  try {
    const token = await getNextAuthToken();
    const headers: Record<string, string> = {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
    };

    const res = await fetch(`${API_URL}/coupons/validate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        code: cleanCode,
        subtotal,
        categoryIds,
      }),
    });

    const data = await res.json();
    if (res.ok && data?.success && data?.data) {
      const { coupon, discountAmount, newTotal } = data.data;
      return {
        valid: true,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        newTotal,
        message: data.message || "تم تطبيق الكوبون بنجاح",
        coupon,
      };
    }

    return {
      valid: false,
      message: data?.message || data?.error || "الكوبون غير صالح أو انتهت صلاحيته",
    };
  } catch (error) {
    return {
      valid: false,
      message: getErrorMessage(error, "تعذر التحقق من الكوبون حالياً"),
    };
  }
}
