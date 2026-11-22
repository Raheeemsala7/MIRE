"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  InventoryMovementsFilterParams,
  InventoryMovementsPaginatedResponse,
} from "../types/inventory.types";
import { fetchInventoryMovements } from "../services/inventory.service";

export const inventoryQueryKeys = {
  all: ["admin", "inventory"] as const,
  movements: (filters: InventoryMovementsFilterParams) =>
    [...inventoryQueryKeys.all, "movements", filters] as const,
  lowStock: (filters?: { page?: number; limit?: number }) =>
    [...inventoryQueryKeys.all, "low-stock", filters] as const,
};

export function useInventoryMovements(
  filters: InventoryMovementsFilterParams = {},
  initialData?: InventoryMovementsPaginatedResponse,
  initialFilters?: InventoryMovementsFilterParams
) {
  // Matching initial data check to avoid hydration flash
  const isMatchingInitial = React.useMemo(() => {
    if (!initialData) return false;
    if (!initialFilters) return true;
    return (
      (filters.page ?? 1) === (initialFilters.page ?? 1) &&
      (filters.limit ?? 20) === (initialFilters.limit ?? 20) &&
      (filters.productId ?? "") === (initialFilters.productId ?? "") &&
      (filters.variantSku ?? "") === (initialFilters.variantSku ?? "") &&
      (filters.type ?? "") === (initialFilters.type ?? "") &&
      ((filters.sortBy || filters.sort) ?? "") ===
        ((initialFilters.sortBy || initialFilters.sort) ?? "")
    );
  }, [filters, initialFilters, initialData]);

  return useQuery({
    queryKey: inventoryQueryKeys.movements(filters),
    queryFn: () => fetchInventoryMovements(filters),
    initialData: isMatchingInitial ? initialData : undefined,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 30,
  });
}
