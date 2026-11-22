"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteCouponAction } from "../apis/coupons.action";
import { couponQueryKeys } from "./use-coupons";

export function useDeleteCoupon(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCouponAction(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      toast.success(res.message || "تم حذف الكوبون بنجاح");
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error("فشل حذف الكوبون", {
        description: error.message,
      });
    },
  });
}
