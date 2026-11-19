"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
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

  const getStatusLabel = (status: string) => {
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
  };

  const chartData = data
    .filter((d) => d.count > 0)
    .map((item) => ({
      name: getStatusLabel(item.status),
      status: item.status,
      count: item.count,
      color: STATUS_COLORS[item.status.toUpperCase()] || "var(--chart-1)",
    }));

  const totalOrders = chartData.reduce((acc, curr) => acc + curr.count, 0);

  const chartConfig: ChartConfig = Object.fromEntries(
    chartData.map((d) => [
      d.name,
      {
        label: d.name,
        color: d.color,
      },
    ])
  );

  return (
    <Card className="flex flex-col rounded-2xl border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg font-semibold text-foreground sm:text-xl">
          {t("analytics-chart-status-title")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("analytics-chart-status-desc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center justify-center pt-2">
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
            <ChartContainer config={chartConfig} className="mx-auto h-52 w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel indicator="line" />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="var(--card)"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Status Legend Pills */}
            <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs">
              {chartData.map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {item.count}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      ({totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0}%)
                    </span>
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
