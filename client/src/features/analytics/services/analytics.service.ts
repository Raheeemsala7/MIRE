import type {
  AnalyticsFilter,
  AnalyticsDashboardData,
  RecentOrderItem,
  LowStockItem,
} from "../types/analytics.types";
import { analyticsResponseSchema } from "../schemas/analytics.schema";

export async function fetchAnalyticsDashboard(
  filter: AnalyticsFilter
): Promise<AnalyticsDashboardData> {
  const params = new URLSearchParams();
  params.set("range", filter.range);
  if (filter.startDate) params.set("startDate", filter.startDate);
  if (filter.endDate) params.set("endDate", filter.endDate);

  const res = await fetch(`/api/admin/analytics?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Analytics API error: ${res.status}`);
  }

  const json = await res.json();
  const parsed = analyticsResponseSchema.safeParse(json);
  if (!parsed.success) {
    // If strict schema fails, return raw data if present or throw
    if (json?.data?.overview && json?.data?.charts) {
      return json.data as AnalyticsDashboardData;
    }
    throw new Error("Invalid analytics payload format from backend");
  }

  return parsed.data.data;
}

export async function fetchRecentOrders(): Promise<RecentOrderItem[]> {
  const res = await fetch("/api/admin/orders/recent?limit=6");
  if (!res.ok) {
    throw new Error(`Recent orders API error: ${res.status}`);
  }
  const json = await res.json();
  return (json.data || []) as RecentOrderItem[];
}

export async function fetchLowStockAlerts(): Promise<LowStockItem[]> {
  const res = await fetch("/api/admin/inventory/low-stock");
  if (!res.ok) {
    throw new Error(`Inventory API error: ${res.status}`);
  }
  const json = await res.json();
  return (json.data || []) as LowStockItem[];
}
