"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { UpdateProductInput } from "../schemas/product.schema";
import { updateProductAction } from "../server/actions";
import { productQueryKeys } from "./use-products";
import type { SingleProductResponse } from "../types/product.types";

export function useUpdateProduct(
  id: string,
  onSuccessCallback?: (res: SingleProductResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (payload: UpdateProductInput) => updateProductAction(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(id) });
      toast.success(
        t("product-update-success") || "Product updated successfully",
        {
          description: `${response.data.name} (${response.data.sku})`,
        }
      );
      onSuccessCallback?.(response);
    },
    onError: (error: Error) => {
      toast.error(
        t("product-update-error") || "Failed to update product",
        {
          description: error.message,
        }
      );
    },
  });
}
