"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  AnalyticsFilter,
  AnalyticsDashboardData,
  RecentOrderItem,
  LowStockItem,
} from "../types/analytics.types";
import {
  fetchAnalyticsDashboard,
  fetchRecentOrders,
  fetchLowStockAlerts,
} from "../services/analytics.service";

export const analyticsQueryKeys = {
  all: ["admin", "analytics"] as const,
  dashboard: (filter: AnalyticsFilter) =>
    [
      "admin",
      "analytics",
      "dashboard",
      filter.range,
      filter.startDate ?? "",
      filter.endDate ?? "",
    ] as const,
  recentOrders: ["admin", "orders", "recent"] as const,
  lowStock: ["admin", "inventory", "lowStock"] as const,
};

export function useAnalytics(
  filter: AnalyticsFilter,
  initialData?: AnalyticsDashboardData
) {
  return useQuery({
    queryKey: analyticsQueryKeys.dashboard(filter),
    queryFn: () => fetchAnalyticsDashboard(filter),
    initialData: filter.range === "30d" && !filter.startDate ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

export function useRecentOrders(initialOrders?: RecentOrderItem[], enabled = true) {
  return useQuery({
    queryKey: analyticsQueryKeys.recentOrders,
    enabled,
    queryFn: fetchRecentOrders,
    initialData: initialOrders,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useLowStockAlerts(initialLowStock?: LowStockItem[], enabled = true) {
  return useQuery({
    queryKey: analyticsQueryKeys.lowStock,
    enabled,
    queryFn: fetchLowStockAlerts,
    initialData: initialLowStock,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
