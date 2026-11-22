"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { adjustStockAction } from "../actions/inventory.actions";
import type {
  AdjustStockPayload,
  AdjustStockResponse,
} from "../types/inventory.types";
import { inventoryQueryKeys } from "./use-inventory-movements";
import { productQueryKeys } from "@/features/products/hooks/use-products";

export function useAdjustStock(onSuccessCallback?: () => void) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<AdjustStockResponse, Error, AdjustStockPayload>({
    mutationFn: (payload: AdjustStockPayload) => adjustStockAction(payload),
    onSuccess: () => {
      // Invalidate inventory React Query caches
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.all,
      });

      // Invalidate products React Query caches
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.all,
      });

      // Refresh Server Components
      router.refresh();

      toast.success(t("inventory-adjust-success") || "Stock adjusted successfully");
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("inventory-adjust-error") ||
          "Failed to adjust stock"
      );
    },
  });
}
