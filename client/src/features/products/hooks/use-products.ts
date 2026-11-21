"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  ProductFilters,
  ProductsPaginatedResponse,
} from "../types/product.types";
import { fetchAdminProducts } from "../services/products.service";

export const productQueryKeys = {
  all: ["admin", "products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productQueryKeys.lists(), filters] as const,
  details: () => [...productQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
};

export function useProducts(
  filters: ProductFilters = {},
  initialData?: ProductsPaginatedResponse,
  initialFilters?: ProductFilters
) {
  // Only supply initialData when current filters match server-rendered initialFilters
  const isMatchingInitial = React.useMemo(() => {
    if (!initialData) return false;
    if (!initialFilters) return true;
    return (
      (filters.page ?? 1) === (initialFilters.page ?? 1) &&
      (filters.limit ?? 20) === (initialFilters.limit ?? 20) &&
      (filters.search ?? "") === (initialFilters.search ?? "") &&
      (filters.category ?? "") === (initialFilters.category ?? "") &&
      (filters.status ?? "") === (initialFilters.status ?? "") &&
      (filters.sortBy ?? "") === (initialFilters.sortBy ?? "")
    );
  }, [filters, initialFilters, initialData]);

  return useQuery({
    queryKey: productQueryKeys.list(filters),
    queryFn: () => fetchAdminProducts(filters),
    initialData: isMatchingInitial ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
}
