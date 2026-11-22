"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCouponAction } from "../server/actions";
import { couponQueryKeys } from "./use-coupons";
import type { CouponRecord } from "@/lib/coupons-store";

export function useCreateCoupon(onSuccessCallback?: (coupon: CouponRecord) => void) {
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
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      toast.success(res.message || "تم إنشاء الكوبون بنجاح", {
        description: res.data.code,
      });
      onSuccessCallback?.(res.data);
    },
    onError: (error: Error) => {
      toast.error("فشل إنشاء الكوبون", {
        description: error.message,
      });
    },
  });
}
