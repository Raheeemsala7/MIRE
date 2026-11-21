"use client";

import { Users, BookOpen, Layers, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { CustomerMetricsData } from "../types/customer.types";

interface CustomersOverviewProps {
  metrics: CustomerMetricsData;
}

export function CustomersOverview({ metrics }: CustomersOverviewProps) {
  // Translation
  const t = useTranslations();

  // Variables
  const items = [
    {
      label: t("customers-metric-total") || "Total Customers",
      value: metrics.total,
      description:
        t("customers-metric-total-desc") || "Registered customer profiles",
      icon: Users,
      iconColor: "text-primary",
      bgBadge: "bg-primary/10 text-primary",
    },
    {
      label: t("customers-metric-pages") || "Directory Pages",
      value: metrics.totalPages,
      description:
        t("customers-metric-pages-desc") || "Navigation index depth",
      icon: BookOpen,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: t("customers-metric-in-view") || "Customers In View",
      value: metrics.pageCount,
      description:
        t("customers-metric-in-view-desc") || "Profiles on current page",
      icon: Layers,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgBadge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: t("customers-metric-with-orders") || "Active Buyers in View",
      value: metrics.withOrdersInView,
      description:
        t("customers-metric-with-orders-desc") || "Customers with 1+ orders on this page",
      icon: ShoppingBag,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="relative overflow-hidden border border-border/60 bg-card/60 transition-shadow hover:shadow-xs"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                <span className={`inline-flex rounded-lg p-2 ${item.bgBadge}`}>
                  <Icon className={`size-4 ${item.iconColor}`} />
                </span>
              </div>
              <div className="mt-3">
                <span className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
