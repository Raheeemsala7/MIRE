"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { LowStockPaginatedResponse } from "../types/inventory.types";
import { fetchLowStockAlerts } from "../services/inventory.service";
import { inventoryQueryKeys } from "./use-inventory-movements";

export function useLowStock(
  filters: { page?: number; limit?: number } = {},
  initialData?: LowStockPaginatedResponse,
  initialFilters?: { page?: number; limit?: number }
) {
  // Matching initial data check to avoid hydration flash
  const isMatchingInitial = React.useMemo(() => {
    if (!initialData) return false;
    if (!initialFilters) return true;
    return (
      (filters.page ?? 1) === (initialFilters.page ?? 1) &&
      (filters.limit ?? 20) === (initialFilters.limit ?? 20)
    );
  }, [filters, initialFilters, initialData]);

  return useQuery({
    queryKey: inventoryQueryKeys.lowStock(filters),
    queryFn: () => fetchLowStockAlerts(filters),
    initialData: isMatchingInitial ? initialData : undefined,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 30,
  });
}
