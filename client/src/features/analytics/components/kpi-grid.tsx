"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Banknote,
  ShoppingBag,
  TrendingUp,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { KpiCard } from "./kpi-card";
import type { DashboardOverview } from "../types/analytics.types";

interface KpiGridProps {
  overview?: DashboardOverview;
  isLoading?: boolean;
}

export function KpiGrid({ overview, isLoading }: KpiGridProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString("en-US")} ${currency}`;
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString("en-US");
  };

  return (
    <div className="space-y-4">
      {/* Primary KPI Row - Official shadcn dashboard-01 4-column layout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <KpiCard
          title={t("analytics-revenue-title")}
          value={
            overview !== undefined
              ? formatCurrency(overview.totalRevenue)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-revenue-desc")}
          badge={
            overview && overview.todayRevenue > 0 ? (
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                +{formatCurrency(overview.todayRevenue)}
              </Badge>
            ) : undefined
          }
          icon={<Banknote className="size-4" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Total Orders */}
        <KpiCard
          title={t("analytics-orders-title")}
          value={
            overview !== undefined
              ? formatNumber(overview.totalOrders)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-orders-desc")}
          badge={
            overview && overview.newOrders > 0 ? (
              <Badge className="bg-primary/10 text-[10px] text-primary hover:bg-primary/20">
                {overview.newOrders} {t("analytics-new-orders")}
              </Badge>
            ) : undefined
          }
          icon={<ShoppingBag className="size-4" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Total Customers */}
        <KpiCard
          title={t("analytics-customers-title")}
          value={
            overview !== undefined
              ? formatNumber(overview.totalCustomers)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-customers-desc")}
          icon={<Users className="size-4" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Average Order Value (AOV) */}
        <KpiCard
          title={t("analytics-aov-title")}
          value={
            overview !== undefined
              ? formatCurrency(overview.averageOrderValue)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-aov-desc")}
          icon={<TrendingUp className="size-4" aria-hidden="true" />}
          isLoading={isLoading}
        />
      </div>

      {/* Operational Performance & Fulfillment Status Bar */}
      {overview && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3 shadow-xs">
          {/* Delivery & Return Rate summary */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t("analytics-delivery-rate")}:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{overview.deliverySuccessRate}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground border-l border-border/60 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
              <span>{t("analytics-return-rate")}:</span>
              <span className="font-semibold text-foreground">{overview.returnRate}</span>
            </div>
          </div>

          {/* Fulfillment Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <Clock className="size-3" />
              {overview.newOrders} {t("analytics-new-orders")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Clock className="size-3" />
              {overview.pendingOrders} {t("analytics-pending-orders")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              {overview.deliveredOrders} {t("analytics-delivered-orders")}
            </span>
            {overview.cancelledOrders > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                <XCircle className="size-3" />
                {overview.cancelledOrders} {t("analytics-cancelled-orders")}
              </span>
            )}
            {overview.returnedOrders > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                <RotateCcw className="size-3" />
                {overview.returnedOrders} {t("analytics-status-returned")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
