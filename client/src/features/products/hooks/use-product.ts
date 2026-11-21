"use client";

import { useQuery } from "@tanstack/react-query";
import { productQueryKeys } from "./use-products";
import { fetchAdminProductById } from "../services/products.service";
import type { SingleProductResponse } from "../types/product.types";

export function useProduct(id: string, initialData?: SingleProductResponse) {
  return useQuery({
    queryKey: productQueryKeys.detail(id),
    queryFn: () => fetchAdminProductById(id),
    initialData,
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
}
