"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
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

  const { hasRealActivity, formattedData } = useMemo(() => {
    const active = data.some(
      (item) => (item.revenue || 0) > 0 || (item.orders || 0) > 0,
    );

    const dateLocale = isAr ? "ar-EG-u-nu-latn" : "en-US";
    const formatted = data.map((item) => {
      try {
        const date = new Date(item._id);
        const displayDate = date.toLocaleDateString(dateLocale, {
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

    return { hasRealActivity: active, formattedData: formatted };
  }, [data, isAr]);

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-6">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground sm:text-lg flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            {t("analytics-chart-revenue-title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("analytics-chart-revenue-desc")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : formattedData.length === 0 || !hasRealActivity ? (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-80 w-full min-w-0"
            dir="ltr"
          >
            <AreaChart
              accessibilityLayer
              data={formattedData}
              margin={{
                top: 10,
                right: isAr ? 20 : 10,
                left: isAr ? 10 : 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.4}
              />

              <XAxis
                dataKey="displayDate"
                reversed={isAr}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={25}
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                }}
              />

              <YAxis
                orientation={isAr ? "right" : "left"}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={55}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                }}
              />

              <ChartTooltip
                cursor={{
                  stroke: "var(--border)",
                  strokeWidth: 1,
                }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => {
                      if (name === "revenue") {
                        const formatted = new Intl.NumberFormat(
                          isAr ? "ar-EG-u-nu-latn" : "en-US",
                        ).format(Number(value));

                        return `${formatted} ${currency}`;
                      }

                      return `${value} ${t("analytics-orders-count")}`;
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
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
