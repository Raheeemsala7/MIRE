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
    return `${val.toLocaleString(isAr ? "ar-EG" : "en-US")} ${currency}`;
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString(isAr ? "ar-EG" : "en-US");
  };

  return (
    <div className="space-y-4">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Revenue */}
        <KpiCard
          title={t("analytics-revenue-title")}
          value={
            overview && overview.totalOrders > 0
              ? formatCurrency(overview.totalRevenue)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-revenue-desc")}
          badge={
            overview && overview.todayRevenue > 0 ? (
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(overview.todayRevenue)}
              </Badge>
            ) : undefined
          }
          icon={<Banknote className="size-5" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Total Orders */}
        <KpiCard
          title={t("analytics-orders-title")}
          value={
            overview && overview.totalOrders > 0
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
          icon={<ShoppingBag className="size-5" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Average Order Value (AOV) */}
        <KpiCard
          title={t("analytics-aov-title")}
          value={
            overview && overview.averageOrderValue > 0
              ? formatCurrency(overview.averageOrderValue)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-aov-desc")}
          icon={<TrendingUp className="size-5" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Total Customers */}
        <KpiCard
          title={t("analytics-customers-title")}
          value={
            overview && overview.totalCustomers > 0
              ? formatNumber(overview.totalCustomers)
              : t("analytics-no-data")
          }
          subtitle={t("analytics-customers-desc")}
          icon={<Users className="size-5" aria-hidden="true" />}
          isLoading={isLoading}
        />

        {/* Delivery Success Rate */}
        <KpiCard
          title={t("analytics-delivery-rate")}
          value={
            overview && overview.totalOrders > 0
              ? overview.deliverySuccessRate
              : t("analytics-no-data")
          }
          subtitle={t("analytics-delivery-desc")}
          icon={<ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
          isLoading={isLoading}
        />
      </div>

      {/* Operational Breakdown Bar */}
      {overview && overview.totalOrders > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2 text-xs">
            <span className="flex size-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">{t("analytics-new-orders")}:</span>
            <span className="font-semibold text-foreground">{overview.newOrders}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2 text-xs">
            <Clock className="size-3.5 text-amber-500" />
            <span className="text-muted-foreground">{t("analytics-pending-orders")}:</span>
            <span className="font-semibold text-foreground">{overview.pendingOrders}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2 text-xs">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span className="text-muted-foreground">{t("analytics-delivered-orders")}:</span>
            <span className="font-semibold text-foreground">{overview.deliveredOrders}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2 text-xs">
            <XCircle className="size-3.5 text-rose-500" />
            <span className="text-muted-foreground">{t("analytics-cancelled-orders")}:</span>
            <span className="font-semibold text-foreground">{overview.cancelledOrders}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2 text-xs">
            <RotateCcw className="size-3.5 text-purple-500" />
            <span className="text-muted-foreground">{t("analytics-return-rate")}:</span>
            <span className="font-semibold text-foreground">{overview.returnRate}</span>
          </div>
        </div>
      ) : overview && overview.totalOrders === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-2.5 text-center text-xs text-muted-foreground">
          {t("analytics-empty-desc")}
        </div>
      ) : null}
    </div>
  );
}
