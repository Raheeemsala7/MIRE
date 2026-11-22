"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  AlertTriangle,
  PackageX,
  Boxes,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { InventoryOverviewStats } from "../types/inventory.types";

interface InventoryOverviewProps {
  stats: InventoryOverviewStats;
}

export function InventoryOverview({ stats }: InventoryOverviewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
  }, [locale]);

  const cards = [
    {
      title: t("inventory-card-low-stock") || "Low Stock Variants",
      value: numberFormatter.format(stats.lowStockCount),
      description:
        t("inventory-card-low-stock-desc") || "Variants at or below threshold",
      icon: AlertTriangle,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgGradient: "from-amber-500/10 to-transparent",
    },
    {
      title: t("inventory-card-out-of-stock") || "Out of Stock Variants",
      value: numberFormatter.format(stats.outOfStockCount),
      description:
        t("inventory-card-out-of-stock-desc") || "Variants with zero stock",
      icon: PackageX,
      iconColor: "text-destructive",
      bgGradient: "from-destructive/10 to-transparent",
    },
    {
      title: t("inventory-card-replenishment") || "Requires Replenishment",
      value: numberFormatter.format(stats.replenishmentProductsCount),
      description:
        t("inventory-card-replenishment-desc") || "Distinct products needing restock",
      icon: Boxes,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bgGradient: "from-indigo-500/10 to-transparent",
    },
    {
      title: t("inventory-card-total-movements") || "Stock Movements",
      value: numberFormatter.format(stats.totalMovements),
      description:
        t("inventory-card-total-movements-desc") || "Recorded audit trail events",
      icon: History,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgGradient: "from-blue-500/10 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card
            key={card.title}
            className="relative overflow-hidden border border-border/60 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} pointer-events-none opacity-40`}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-lg bg-background/80 shadow-xs">
                <IconComponent className={`size-4.5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {card.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
