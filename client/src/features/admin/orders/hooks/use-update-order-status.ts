"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateOrderStatusAction } from "../apis/orders.action";
import type { OrderDoc, OrderStatus } from "../types/order-admin.types";

export function useUpdateOrderStatus(
  onSuccessCallback?: (data?: OrderDoc) => void,
  onErrorCallback?: (error: Error) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { orderId: string; status: OrderStatus; reason?: string }) =>
      updateOrderStatusAction(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success(res.message || "تم تحديث حالة الطلب بنجاح");
      onSuccessCallback?.(res.data);
    },
    onError: (error: Error) => {
      toast.error("فشل تحديث حالة الطلب", {
        description: error.message,
      });
      onErrorCallback?.(error);
    },
  });
}
