"use client";

import { useMutation } from "@tanstack/react-query";
import { validateCouponAction } from "../apis/coupons.action";

export function useValidateCoupon(
  onSuccessCallback?: (data: {
    discount: number;
    appliedCoupon: {
      code: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
      discountValue: number;
      minOrderAmount: number;
    };
  }) => void,
  onErrorCallback?: (error: Error) => void
) {
  return useMutation({
    mutationFn: async (payload: { code: string; subtotal: number }) => {
      const res = await validateCouponAction(payload.code, payload.subtotal);
      if (!res.valid) {
        throw new Error(res.message || "الكوبون غير صالح");
      }
      return res;
    },
    onSuccess: (res) => {
      onSuccessCallback?.({
        discount: res.discountAmount || 0,
        appliedCoupon: {
          code: res.coupon?.code || "",
          discountType: res.discountType || "FIXED_AMOUNT",
          discountValue: res.discountValue || 0,
          minOrderAmount: res.coupon?.minOrderAmount || 0,
        },
      });
    },
    onError: (error: Error) => {
      onErrorCallback?.(error);
    },
  });
}
