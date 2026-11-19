"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
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
import type { DailyRevenueItem } from "../types/analytics.types";

interface RevenueChartProps {
  data?: DailyRevenueItem[];
  isLoading?: boolean;
}

export function RevenueChart({ data = [], isLoading }: RevenueChartProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const chartConfig = {
    revenue: {
      label: t("analytics-revenue"),
      color: "var(--chart-1)",
    },
    orders: {
      label: t("analytics-orders-count"),
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  // Format date labels nicely (e.g., Nov 12 / ١٢ نوفمبر)
  const hasRealActivity = data.some((item) => (item.revenue || 0) > 0 || (item.orders || 0) > 0);

  const formattedData = data.map((item) => {
    try {
      const date = new Date(item._id);
      const displayDate = date.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        ...item,
        displayDate,
      };
    } catch {
      return {
        ...item,
        displayDate: item._id,
      };
    }
  });

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="font-serif text-lg font-semibold text-foreground sm:text-xl">
            {t("analytics-chart-revenue-title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("analytics-chart-revenue-desc")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : formattedData.length === 0 || !hasRealActivity ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedData}
                margin={{ top: 10, right: isAr ? 20 : 10, left: isAr ? 10 : 20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(val) => `${val.toLocaleString()} ${currency}`}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  orientation={isAr ? "right" : "left"}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(val, name) => {
                        if (name === "revenue") {
                          return `${Number(val).toLocaleString()} ${currency}`;
                        }
                        return `${val} ${t("analytics-orders-count")}`;
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fillRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
