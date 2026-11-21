"use client";

import { useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { OrderStatusItem } from "../types/analytics.types";

interface OrderStatusChartProps {
  data?: OrderStatusItem[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6", // Blue
  CONFIRMED: "#0ea5e9", // Sky
  PROCESSING: "#eab308", // Yellow
  READY_TO_SHIP: "#8b5cf6", // Purple
  SHIPPED: "#6366f1", // Indigo
  DELIVERED: "#10b981", // Emerald
  CANCELLED: "#f43f5e", // Rose
  RETURNED: "#a855f7", // Purple/Violet
};

export function OrderStatusChart({ data = [], isLoading }: OrderStatusChartProps) {
  const t = useTranslations();

  const getStatusLabel = useCallback(
    (status: string) => {
      switch (status.toUpperCase()) {
        case "NEW":
          return t("analytics-status-new");
        case "CONFIRMED":
          return t("analytics-status-confirmed");
        case "PROCESSING":
          return t("analytics-status-processing");
        case "READY_TO_SHIP":
          return t("analytics-status-ready_to_ship");
        case "SHIPPED":
          return t("analytics-status-shipped");
        case "DELIVERED":
          return t("analytics-status-delivered");
        case "CANCELLED":
          return t("analytics-status-cancelled");
        case "RETURNED":
          return t("analytics-status-returned");
        default:
          return status;
      }
    },
    [t]
  );

  const { chartData, chartConfig } = useMemo(() => {
    const cd = data
      .filter((d) => d.count > 0)
      .map((item) => ({
        name: getStatusLabel(item.status),
        status: item.status,
        count: item.count,
        color: STATUS_COLORS[item.status.toUpperCase()] || "var(--chart-1)",
      }));

    const cfg: ChartConfig = Object.fromEntries(
      cd.map((d) => [
        d.name,
        {
          label: d.name,
          color: d.color,
        },
      ])
    );

    return { chartData: cd, chartConfig: cfg };
  }, [data, getStatusLabel]);

  return (
    <Card className="flex flex-col rounded-xl border border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-2 pt-5 px-6">
        <CardTitle className="text-base font-semibold text-foreground sm:text-lg flex items-center gap-2">
          <PieChartIcon className="size-4 text-primary" />
          {t("analytics-chart-status-title")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("analytics-chart-status-desc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-2">
        {isLoading ? (
          <Skeleton className="size-48 rounded-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-56 w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={75}
                  strokeWidth={2}
                  stroke="var(--card)"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Custom Legend Grid */}
            <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs">
              {chartData.map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-muted-foreground text-[11px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
