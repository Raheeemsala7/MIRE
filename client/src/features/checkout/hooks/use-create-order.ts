"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutAction } from "../apis/checkout.action";
import type { CheckoutPayload, PlacedOrder } from "../types/checkout";

export const orderQueryKeys = {
  all: ["orders"] as const,
  lists: () => [...orderQueryKeys.all, "list"] as const,
  detail: (id: string) => [...orderQueryKeys.all, "detail", id] as const,
};

export function useCreateOrder(
  onSuccessCallback?: (order: PlacedOrder) => void,
  onErrorCallback?: (error: Error) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CheckoutPayload & {
        couponCode?: string;
        couponDiscount?: number;
        pricing?: {
          subtotal: number;
          couponDiscount: number;
          shippingFee: number;
          totalAmount: number;
        };
      }
    ) => checkoutAction(payload),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
        onSuccessCallback?.(res.data);
      } else {
        onErrorCallback?.(new Error(res.message || "Failed to place order"));
      }
    },
    onError: (error: Error) => {
      onErrorCallback?.(error);
    },
  });
}
