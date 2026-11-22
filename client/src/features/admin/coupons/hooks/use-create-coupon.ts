"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCouponAction } from "../apis/coupons.action";
import { couponQueryKeys } from "./use-coupons";
import type { CouponItem } from "../types/coupon.types";

export function useCreateCoupon(onSuccessCallback?: (coupon?: CouponItem) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
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
    }) => createCouponAction(payload),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
        toast.success(res.message || "تم إنشاء الكوبون بنجاح", {
          description: res.data.code,
        });
        onSuccessCallback?.(res.data);
      } else {
        toast.error(res.message || "فشل إنشاء الكوبون");
      }
    },
    onError: (error: Error) => {
      toast.error("فشل إنشاء الكوبون", {
        description: error.message,
      });
    },
  });
}
