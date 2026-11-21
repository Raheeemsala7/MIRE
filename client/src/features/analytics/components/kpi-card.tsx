import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
      <Card className="rounded-xl border border-border/60 bg-card py-4 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-0 px-5 space-y-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-4 rounded-full" />
        </CardHeader>
        <CardContent className="px-5 pt-0 pb-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-1.5 h-3.5 w-44" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-border/60 bg-card py-4 shadow-xs transition-colors hover:border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-0 px-5 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground shrink-0 size-4 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-0 pb-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {badge && <div>{badge}</div>}
        </div>
        {(subtitle || trendText) && (
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            {subtitle && <span>{subtitle}</span>}
            {trendText && <span className="font-medium text-foreground">{trendText}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
