"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  BundleFilters,
  BundlesPaginatedResponse,
} from "../types/bundle.types";
import { fetchAdminBundles } from "../services/bundles.service";

export const bundleQueryKeys = {
  all: ["admin", "bundles"] as const,
  lists: () => [...bundleQueryKeys.all, "list"] as const,
  list: (filters: BundleFilters) => [...bundleQueryKeys.lists(), filters] as const,
  details: () => [...bundleQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...bundleQueryKeys.details(), id] as const,
};

export function useBundles(
  filters: BundleFilters = {},
  initialData?: BundlesPaginatedResponse,
  initialFilters?: BundleFilters
) {
  // Only supply initialData when current filters match server-rendered initialFilters
  const isMatchingInitial = React.useMemo(() => {
    if (!initialData) return false;
    if (!initialFilters) return true;
    return (
      (filters.page ?? 1) === (initialFilters.page ?? 1) &&
      (filters.limit ?? 20) === (initialFilters.limit ?? 20) &&
      (filters.search ?? "") === (initialFilters.search ?? "") &&
      (filters.type ?? "") === (initialFilters.type ?? "") &&
      (filters.status ?? "ALL") === (initialFilters.status ?? "ALL") &&
      (filters.sortBy ?? "") === (initialFilters.sortBy ?? "")
    );
  }, [filters, initialFilters, initialData]);

  return useQuery({
    queryKey: bundleQueryKeys.list(filters),
    queryFn: () => fetchAdminBundles(filters),
    initialData: isMatchingInitial ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
}
