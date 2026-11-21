"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { archiveProductAction } from "../server/actions";
import { productQueryKeys } from "./use-products";

export function useArchiveProduct(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (id: string) => archiveProductAction(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success(
        t("product-archive-success") || "Product archived successfully",
        {
          description: response.message,
        }
      );
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(
        t("product-archive-error") || "Failed to archive product",
        {
          description: error.message,
        }
      );
    },
  });
}
