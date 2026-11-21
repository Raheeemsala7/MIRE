"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  RotateCcw,
  Clock,
  CheckCircle,
  Truck,
  ClipboardCheck,
  BadgeCheck,
  XCircle,
} from "lucide-react";
import type { ReturnsOverviewStats } from "../../types/return.types";

interface ReturnsOverviewProps {
  stats?: ReturnsOverviewStats;
  locale?: string;
}

export const ReturnsOverview = React.memo(function ReturnsOverview({
  stats,
  locale = "en",
}: ReturnsOverviewProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const cards = [
    {
      title: t("returns-overview-total") || "Total Returns",
      value: stats?.total ?? 0,
      icon: RotateCcw,
      iconColor: "text-primary",
      bgClass: "bg-primary/5",
    },
    {
      title: t("returns-overview-pending") || "Pending Requests",
      value: stats?.pending ?? 0,
      icon: Clock,
      iconColor: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      title: t("returns-overview-approved") || "Approved",
      value: stats?.approved ?? 0,
      icon: CheckCircle,
      iconColor: "text-blue-500",
      bgClass: "bg-blue-500/10",
    },
    {
      title: t("returns-overview-pickup") || "Pickup / Transit",
      value: stats?.inTransit ?? 0,
      icon: Truck,
      iconColor: "text-purple-500",
      bgClass: "bg-purple-500/10",
    },
    {
      title: t("returns-overview-inspected") || "Inspected",
      value: stats?.inspected ?? 0,
      icon: ClipboardCheck,
      iconColor: "text-teal-500",
      bgClass: "bg-teal-500/10",
    },
    {
      title: t("returns-overview-refunded") || "Refunded",
      value: stats?.refunded ?? 0,
      icon: BadgeCheck,
      iconColor: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      title: t("returns-overview-rejected") || "Rejected",
      value: stats?.rejected ?? 0,
      icon: XCircle,
      iconColor: "text-rose-500",
      bgClass: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-border/60 bg-card shadow-xs transition-all hover:border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground line-clamp-1">
                {card.title}
              </CardTitle>
              <div className={`size-7 rounded-lg flex items-center justify-center ${card.bgClass} shrink-0`}>
                <Icon className={`size-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              <div className="text-xl font-bold tracking-tight text-foreground" dir="ltr">
                {card.value.toLocaleString(isAr ? "ar-EG" : "en-US")}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
