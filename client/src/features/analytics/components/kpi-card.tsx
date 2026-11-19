"use client";

import type { ReactNode } from "react";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
  trendText?: string;
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  trendText,
  isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-9 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-8 w-32" />
        <Skeleton className="mt-2 h-3.5 w-40" />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {value}
            </span>
            {badge && <div>{badge}</div>}
          </div>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-primary ring-1 ring-border/50">
          {icon}
        </div>
      </div>

      {(subtitle || trendText) && (
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
          {subtitle && <span>{subtitle}</span>}
          {trendText && <span className="font-medium text-foreground">{trendText}</span>}
        </div>
      )}
    </Card>
  );
}
