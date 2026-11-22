"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrderAction } from "../server/actions";
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
    ) => createOrderAction(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      onSuccessCallback?.(res.data);
    },
    onError: (error: Error) => {
      onErrorCallback?.(error);
    },
  });
}
