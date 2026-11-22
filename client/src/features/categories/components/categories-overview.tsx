"use client";

import { useTranslations } from "next-intl";
import { FolderTree, Folders, GitFork, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { CategoryOverviewStats } from "../types/category.types";

interface CategoriesOverviewProps {
  stats: CategoryOverviewStats;
}

export function CategoriesOverview({ stats }: CategoriesOverviewProps) {
  const t = useTranslations();

  const cards = [
    {
      title: t("categories-stat-total"),
      value: stats.totalCategories,
      description: t("categories-stat-total-desc"),
      icon: FolderTree,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("categories-stat-parents"),
      value: stats.parentCategories,
      description: t("categories-stat-parents-desc"),
      icon: Folders,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      title: t("categories-stat-subs"),
      value: stats.subcategories,
      description: t("categories-stat-subs-desc"),
      icon: GitFork,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: t("categories-stat-active"),
      value: stats.activeCategories,
      description: t("categories-stat-active-desc"),
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
