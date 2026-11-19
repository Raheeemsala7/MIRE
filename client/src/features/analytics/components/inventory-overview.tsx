"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle } from "lucide-react";
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

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-serif text-lg font-semibold text-foreground sm:text-xl">
              {t("analytics-inventory-title")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t("analytics-inventory-desc")}
            </CardDescription>
          </div>
          {items.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {items.length} alerts
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
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
                className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground line-clamp-1 max-w-[220px]">
                    {item.productName}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {item.variantSku} · {item.color} / {item.size}
                  </p>
                </div>

                <div className="text-end">
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
                    Threshold: {item.threshold}
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
