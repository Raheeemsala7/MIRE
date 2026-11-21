"use client";

import { useTranslations } from "next-intl";
import { Package, CheckCircle2, Archive, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { ProductOverviewStats } from "../../types/product.types";

interface ProductsOverviewProps {
  stats: ProductOverviewStats;
}

export function ProductsOverview({ stats }: ProductsOverviewProps) {
  const t = useTranslations();

  const cards = [
    {
      title: t("products-metric-total"),
      value: stats.totalProducts,
      description: t("products-metric-total-desc"),
      icon: Package,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("products-metric-active"),
      value: stats.activeProducts,
      description: t("products-metric-active-desc"),
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: t("products-metric-archived"),
      value: stats.archivedProducts,
      description: t("products-metric-archived-desc"),
      icon: Archive,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      title: t("products-metric-low-stock"),
      value: stats.lowStockProducts,
      description: t("products-metric-low-stock-desc"),
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: t("products-metric-out-of-stock"),
      value: stats.outOfStockProducts,
      description: t("products-metric-out-of-stock-desc"),
      icon: XCircle,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className="border-border/60 bg-card/60 backdrop-blur-xs transition-shadow hover:shadow-xs"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${card.bgColor}`}
              >
                <Icon className={`size-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {card.value.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-normal truncate">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
