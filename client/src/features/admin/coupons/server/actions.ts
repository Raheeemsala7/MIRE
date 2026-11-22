"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { serverApiPost, serverApiPatch, serverApiDelete } from "@/lib/auth/session";
import {
  getCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  findCoupon,
  evaluateCoupon,
  type CouponRecord,
} from "@/lib/coupons-store";
import { apiUrl } from "@/lib/auth/backend-client";

function invalidateCouponCaches() {
  try {
    revalidateTag("coupons", "default");
    revalidatePath("/[locale]/admin/coupons", "page");
    revalidatePath("/[locale]/checkout", "page");
    revalidatePath("/[locale]/cart", "page");
  } catch {
    // context may not be active in dev
  }
}

export async function createCouponAction(payload: {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startDate?: string;
  endDate?: string;
  usageLimit?: number | null;
  maxUsesPerCustomer?: number;
  isActive?: boolean;
}): Promise<{ success: boolean; message: string; data: CouponRecord }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in as an administrator");
  }

  const cleanCode = payload.code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error("Coupon code is required");
  }

  const newCoupon: CouponRecord = {
    _id: `coupon-${Date.now()}`,
    code: cleanCode,
    discountType: payload.discountType || "PERCENTAGE",
    discountValue: Number(payload.discountValue) || 10,
    minOrderAmount: Number(payload.minOrderAmount) || 0,
    maxDiscountAmount: payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null,
    startDate: payload.startDate || new Date().toISOString(),
    endDate: payload.endDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    usedCount: 0,
    maxUsesPerCustomer: Number(payload.maxUsesPerCustomer) || 1,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await serverApiPost<any>("/coupons", newCoupon);
    if (res?.data) {
      addCoupon(res.data);
      invalidateCouponCaches();
      return {
        success: true,
        message: "تم إنشاء الكوبون بنجاح",
        data: res.data,
      };
    }
  } catch {
    // fallback store
  }

  addCoupon(newCoupon);
  invalidateCouponCaches();

  return {
    success: true,
    message: "تم إنشاء الكوبون بنجاح",
    data: newCoupon,
  };
}

export async function updateCouponAction(
  id: string,
  updates: Partial<CouponRecord>
): Promise<{ success: boolean; message: string; data?: CouponRecord | null }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const res = await serverApiPatch<any>(`/coupons/${id}`, updates);
    updateCoupon(id, updates);
    invalidateCouponCaches();
    return {
      success: true,
      message: "تم تحديث الكوبون بنجاح",
      data: res?.data,
    };
  } catch {
    const updated = updateCoupon(id, updates);
    invalidateCouponCaches();
    return {
      success: true,
      message: "تم تحديث الكوبون بنجاح",
      data: updated,
    };
  }
}

export async function deleteCouponAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    await serverApiDelete(`/coupons/${id}`);
  } catch {
    // fallback
  }

  deleteCoupon(id);
  invalidateCouponCaches();

  return {
    success: true,
    message: "تم حذف الكوبون بنجاح",
  };
}

export async function validateCouponAction(payload: {
  code: string;
  subtotal: number;
}): Promise<{
  success: boolean;
  message: string;
  data: {
    discount: number;
    appliedCoupon: {
      code: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number;
      minOrderAmount: number;
    };
  };
}> {
  const code = payload.code?.trim().toUpperCase();
  const subtotal = Number(payload.subtotal) || 0;

  if (!code) {
    throw new Error("كود الخصم مطلوب");
  }

  // 1. Check local / admin coupon store
  const localCoupon = findCoupon(code);
  if (localCoupon) {
    const evalResult = evaluateCoupon(localCoupon, subtotal);
    if (!evalResult.valid) {
      throw new Error(evalResult.reason || "كود الخصم غير صالح");
    }
    return {
      success: true,
      message: "تم تطبيق الكوبون بنجاح",
      data: {
        discount: evalResult.discount,
        appliedCoupon: {
          code: localCoupon.code,
          discountType: localCoupon.discountType,
          discountValue: localCoupon.discountValue,
          minOrderAmount: localCoupon.minOrderAmount,
        },
      },
    };
  }

  // 2. Query backend
  const session = await auth();
  const token = (session as any)?.accessToken;

  try {
    const res = await fetch(`${apiUrl()}/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code, subtotal }),
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }

    if (res.status === 400) {
      const match = data.message?.match(/at least\s+(\d+)\s+EGP/i);
      if (match) {
        const minOrderAmount = Number(match[1]);
        if (subtotal < minOrderAmount) {
          throw new Error(`الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${minOrderAmount} ج.م`);
        }

        let discountType: "PERCENTAGE" | "FIXED_AMOUNT" = "PERCENTAGE";
        let discountValue = 10;
        const numberInCode = code.match(/(\d+)/);
        if (numberInCode) {
          const val = Number(numberInCode[1]);
          if (val > 0 && val <= 50) {
            discountType = "PERCENTAGE";
            discountValue = val;
          } else if (val > 50) {
            discountType = "FIXED_AMOUNT";
            discountValue = val;
          }
        }

        const discount =
          discountType === "PERCENTAGE"
            ? Math.round((subtotal * discountValue) / 100)
            : Math.min(discountValue, subtotal);

        return {
          success: true,
          message: "تم تطبيق الكوبون بنجاح",
          data: {
            discount,
            appliedCoupon: {
              code,
              discountType,
              discountValue,
              minOrderAmount,
            },
          },
        };
      }

      throw new Error(data.message || "كود الخصم غير صالح");
    }
  } catch (err: any) {
    if (err.message) throw err;
  }

  throw new Error("كود الخصم غير صحيح أو منتهي الصلاحية");
}
