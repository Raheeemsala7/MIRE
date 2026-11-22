"use client";

import { useMutation } from "@tanstack/react-query";
import { validateCouponAction } from "../server/actions";

export function useValidateCoupon(
  onSuccessCallback?: (data: {
    discount: number;
    appliedCoupon: {
      code: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number;
      minOrderAmount: number;
    };
  }) => void,
  onErrorCallback?: (error: Error) => void
) {
  return useMutation({
    mutationFn: (payload: { code: string; subtotal: number }) =>
      validateCouponAction(payload),
    onSuccess: (res) => {
      onSuccessCallback?.(res.data);
    },
    onError: (error: Error) => {
      onErrorCallback?.(error);
    },
  });
}
