"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { CreateProductInput } from "../schemas/product.schema";
import { createProductAction } from "../server/actions";
import { productQueryKeys } from "./use-products";
import type { SingleProductResponse } from "../types/product.types";

export function useCreateProduct(
  onSuccessCallback?: (res: SingleProductResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (payload: CreateProductInput) => createProductAction(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success(
        t("product-create-success") || "Product created successfully",
        {
          description: `${response.data.name} (${response.data.sku})`,
        }
      );
      onSuccessCallback?.(response);
    },
    onError: (error: Error) => {
      toast.error(
        t("product-create-error") || "Failed to create product",
        {
          description: error.message,
        }
      );
    },
  });
}
