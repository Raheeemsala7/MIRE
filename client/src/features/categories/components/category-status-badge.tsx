"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";

interface CategoryStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function CategoryStatusBadge({
  isActive,
  className = "",
}: CategoryStatusBadgeProps) {
  const t = useTranslations();

  if (isActive) {
    return (
      <Badge
        variant="outline"
        className={`border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-xs px-2.5 py-0.5 rounded-full ${className}`}
      >
        <span className="size-1.5 rounded-full bg-emerald-500 me-1.5 inline-block" />
        {t("categories-filter-status-active")}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`border-muted-foreground/30 bg-muted/50 text-muted-foreground font-medium text-xs px-2.5 py-0.5 rounded-full ${className}`}
    >
      <span className="size-1.5 rounded-full bg-muted-foreground/60 me-1.5 inline-block" />
      {t("categories-filter-status-inactive")}
    </Badge>
  );
}
