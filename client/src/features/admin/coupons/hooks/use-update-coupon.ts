"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateCouponAction } from "../apis/coupons.action";
import { couponQueryKeys } from "./use-coupons";
import type { CouponItem, UpdateCouponInput } from "../types/coupon.types";

export function useUpdateCoupon(onSuccessCallback?: (coupon?: CouponItem | null) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCouponInput }) =>
      updateCouponAction(id, updates),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
        toast.success(res.message || "تم تحديث الكوبون بنجاح");
        onSuccessCallback?.(res.data);
      } else {
        toast.error(res.message || "فشل تحديث الكوبون");
      }
    },
    onError: (error: Error) => {
      toast.error("فشل تحديث الكوبون", {
        description: error.message,
      });
    },
  });
}
