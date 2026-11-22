"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { serverApiPost, serverApiPatch, serverApiDelete } from "@/lib/auth/session";
import { apiUrl, BackendApiError } from "@/lib/auth/backend-client";
import type { CouponItem } from "../components/coupons-manager";

function invalidateCouponCaches() {
  try {
    revalidateTag("coupons", "default");
    revalidatePath("/[locale]/admin/coupons", "page");
    revalidatePath("/[locale]/checkout", "page");
    revalidatePath("/[locale]/cart", "page");
  } catch {
    // context may not be active
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
}): Promise<{ success: boolean; message: string; data: CouponItem }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in as an administrator");
  }

  const cleanCode = payload.code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error("Coupon code is required");
  }

  const body = {
    code: cleanCode,
    discountType: payload.discountType,
    discountValue: Number(payload.discountValue),
    minOrderAmount: Number(payload.minOrderAmount) || 0,
    maxDiscountAmount: payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null,
    startDate: payload.startDate || new Date().toISOString(),
    endDate: payload.endDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    maxUsesPerCustomer: Number(payload.maxUsesPerCustomer) || 1,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };

  try {
    const res = await serverApiPost<{
      success: boolean;
      message: string;
      data: CouponItem;
    }>("/coupons", body);

    invalidateCouponCaches();
    return res;
  } catch (error: any) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to create coupon in database");
    }
    throw new Error(error.message || "Failed to create coupon");
  }
}

export async function updateCouponAction(
  id: string,
  updates: Partial<CouponItem>
): Promise<{ success: boolean; message: string; data?: CouponItem }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const res = await serverApiPatch<{
      success: boolean;
      message: string;
      data: CouponItem;
    }>(`/coupons/${id}`, updates);

    invalidateCouponCaches();
    return res;
  } catch (error: any) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update coupon in database");
    }
    throw new Error(error.message || "Failed to update coupon");
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
    const res = await serverApiDelete<{ success: boolean; message: string }>(`/coupons/${id}`);
    invalidateCouponCaches();
    return res;
  } catch (error: any) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to delete coupon from database");
    }
    throw new Error(error.message || "Failed to delete coupon");
  }
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

  const session = await auth();
  const token = (session as any)?.accessToken;

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

  throw new Error(data.message || "كود الخصم غير صالح أو منتهي الصلاحية");
}
