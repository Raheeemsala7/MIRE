"use client";

import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { LowStockItem } from "../types/analytics.types";

interface InventoryOverviewProps {
  items?: LowStockItem[];
  isLoading?: boolean;
}

export function InventoryOverview({ items = [], isLoading }: InventoryOverviewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-6">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground sm:text-lg flex items-center gap-2">
            <Package className="size-4 text-primary" />
            {t("analytics-inventory-title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("analytics-inventory-desc")}
          </CardDescription>
        </div>
        {items.length > 0 && (
          <Badge variant="destructive" className="text-[10px] py-0">
            {items.length} {t("analytics-alerts") || (isAr ? "تنبيهات" : "alerts")}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center text-center">
            <CheckCircle className="size-8 text-emerald-500/70" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium text-foreground">
              {t("analytics-inventory-empty-title")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("analytics-inventory-empty-desc")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.variantSku}
                className="flex items-center justify-between py-2.5 text-xs first:pt-1 last:pb-1"
              >
                <div className="space-y-0.5 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                  <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                    {item.productName}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {item.variantSku} · {item.color} / {item.size}
                  </p>
                </div>

                <div className="text-end shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${
                      item.stockQuantity === 0
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    {item.stockQuantity} {t("analytics-stock-remaining")}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {t("analytics-threshold") || (isAr ? "الحد الأدنى" : "Threshold")}: {item.threshold}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
