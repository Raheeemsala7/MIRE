"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ReturnsFilterParams,
  ReturnsPaginatedResponse,
  ReturnsOverviewStats,
} from "../types/return.types";
import { fetchReturns, fetchReturnsStats } from "../services/returns.service";

export const returnQueryKeys = {
  all: ["returns"] as const,
  lists: () => [...returnQueryKeys.all, "list"] as const,
  list: (filters: ReturnsFilterParams) => [...returnQueryKeys.lists(), filters] as const,
  details: () => [...returnQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...returnQueryKeys.details(), id] as const,
  stats: () => [...returnQueryKeys.all, "stats"] as const,
  deliveredOrders: () => ["customer-delivered-orders"] as const,
};

export function useReturns(
  filters: ReturnsFilterParams = {},
  initialData?: ReturnsPaginatedResponse
) {
  return useQuery({
    queryKey: returnQueryKeys.list(filters),
    queryFn: () => fetchReturns(filters),
    initialData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useReturnsStats(initialData?: {
  success: boolean;
  data: ReturnsOverviewStats;
}) {
  return useQuery({
    queryKey: returnQueryKeys.stats(),
    queryFn: () => fetchReturnsStats(),
    initialData,
    staleTime: 1000 * 30,
  });
}
