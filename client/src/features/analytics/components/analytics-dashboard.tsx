"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { AnalyticsFilter, DashboardCompositeData } from "../types/analytics.types";
import { useAnalytics, useRecentOrders, useLowStockAlerts } from "../hooks/use-analytics";
import { AnalyticsFilters } from "./analytics-filters";
import { KpiGrid } from "./kpi-grid";
import { RevenueChart } from "./revenue-chart";
import { OrderStatusChart } from "./order-status-chart";
import { CategorySalesChart } from "./category-sales-chart";
import { PaymentMethodsChart } from "./payment-methods-chart";
import { TopProducts } from "./top-products";
import { RecentOrders } from "./recent-orders";
import { InventoryOverview } from "./inventory-overview";

interface AnalyticsDashboardProps {
  initialData?: DashboardCompositeData;
  locale: string;
  canViewOrders: boolean;
  canViewInventory: boolean;
}

export function AnalyticsDashboard({ initialData, canViewOrders, canViewInventory }: AnalyticsDashboardProps) {
  const t = useTranslations();
  const [filter, setFilter] = useState<AnalyticsFilter>({ range: "30d" });

  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    isFetching: isAnalyticsFetching,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useAnalytics(filter, initialData?.analytics);

  const {
    data: recentOrders,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useRecentOrders(initialData?.recentOrders, canViewOrders);

  const {
    data: lowStockItems,
    isLoading: isInventoryLoading,
    refetch: refetchInventory,
  } = useLowStockAlerts(initialData?.lowStockItems, canViewInventory);

  const handleRefreshAll = () => {
    void refetchAnalytics();
    if (canViewOrders) void refetchOrders();
    if (canViewInventory) void refetchInventory();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("analytics-title")}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            {t("analytics-subtitle")}
          </p>
        </div>

        <AnalyticsFilters
          filter={filter}
          onChange={setFilter}
          isFetching={isAnalyticsFetching}
          onRefresh={handleRefreshAll}
        />
      </div>

      {/* Main Error Banner (if analytics fails) */}
      {isAnalyticsError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>{t("analytics-error-desc")}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAnalytics()}
            className="h-7 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="size-3 ltr:mr-1.5 rtl:ml-1.5" aria-hidden="true" />
            {t("analytics-error-retry")}
          </Button>
        </div>
      )}

      {/* KPI Overview Cards (Row 1: 4 core cards + operational status bar) */}
      <KpiGrid
        overview={analyticsData?.overview}
        isLoading={isAnalyticsLoading && !analyticsData}
      />

      {/* Main Row: Overview Chart (7 cols) + Recent Sales / Orders (5 cols) (dashboard-01 style) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={canViewOrders ? "lg:col-span-7" : "lg:col-span-12"}>
          <RevenueChart
            data={analyticsData?.charts?.dailyRevenue}
            isLoading={isAnalyticsLoading && !analyticsData}
          />
        </div>
        {canViewOrders && (
          <div className="lg:col-span-5">
            <RecentOrders
              orders={recentOrders}
              isLoading={isOrdersLoading && !recentOrders}
            />
          </div>
        )}
      </div>

      {/* Secondary Row: 3 Breakdown Cards (4 cols each) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <OrderStatusChart
            data={analyticsData?.charts?.ordersByStatus}
            isLoading={isAnalyticsLoading && !analyticsData}
          />
        </div>
        <div className="lg:col-span-4">
          <CategorySalesChart
            data={analyticsData?.charts?.salesByCategory}
            isLoading={isAnalyticsLoading && !analyticsData}
          />
        </div>
        <div className="lg:col-span-4">
          <PaymentMethodsChart
            data={analyticsData?.charts?.paymentDistribution}
            isLoading={isAnalyticsLoading && !analyticsData}
          />
        </div>
      </div>

      {/* Tertiary Row: Top Products (7 cols) + Inventory Overview (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={canViewInventory ? "lg:col-span-7" : "lg:col-span-12"}>
          <TopProducts
            data={analyticsData?.charts?.bestSellers}
            isLoading={isAnalyticsLoading && !analyticsData}
          />
        </div>
        {canViewInventory && (
          <div className="lg:col-span-5">
            <InventoryOverview
              items={lowStockItems}
              isLoading={isInventoryLoading && !lowStockItems}
            />
          </div>
        )}
      </div>
    </div>
  );
}
