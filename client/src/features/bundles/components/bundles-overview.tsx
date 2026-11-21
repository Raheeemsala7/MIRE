import { useTranslations } from "next-intl";
import { Sparkles, CheckCircle2, Clock, AlertTriangle, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { BundleOverviewStats } from "../types/bundle.types";

interface BundlesOverviewProps {
  stats: BundleOverviewStats;
}

export function BundlesOverview({ stats }: BundlesOverviewProps) {
  const t = useTranslations();

  const cards = [
    {
      title: t("bundle-metric-total") || "Total Offers",
      value: stats.totalBundles,
      desc: t("bundle-metric-total-desc") || "All configured promotions",
      icon: Sparkles,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("bundle-metric-active") || "Active Offers",
      value: stats.activeBundles,
      desc: t("bundle-metric-active-desc") || "Currently live and valid",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: t("bundle-metric-scheduled") || "Scheduled",
      value: stats.scheduledBundles,
      desc: t("bundle-metric-scheduled-desc") || "Upcoming start dates",
      icon: Clock,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: t("bundle-metric-expired") || "Expired",
      value: stats.expiredBundles,
      desc: t("bundle-metric-expired-desc") || "Past validity window",
      icon: AlertTriangle,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
    },
    {
      title: t("bundle-metric-inactive") || "Inactive",
      value: stats.inactiveBundles,
      desc: t("bundle-metric-inactive-desc") || "Manually disabled",
      icon: Ban,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className="border-border/60 bg-card/60 backdrop-blur-xs transition-shadow hover:shadow-xs"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                <Icon className={`size-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {card.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {card.desc}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
