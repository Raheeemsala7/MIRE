"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateCouponAction } from "../server/actions";
import { couponQueryKeys } from "./use-coupons";
import type { CouponRecord } from "@/lib/coupons-store";

export function useUpdateCoupon(onSuccessCallback?: (coupon?: CouponRecord | null) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CouponRecord> }) =>
      updateCouponAction(id, updates),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      toast.success(res.message || "تم تحديث الكوبون بنجاح");
      onSuccessCallback?.(res.data);
    },
    onError: (error: Error) => {
      toast.error("فشل تحديث الكوبون", {
        description: error.message,
      });
    },
  });
}
