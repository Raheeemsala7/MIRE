"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Layers } from "lucide-react";

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
import type { CategorySalesItem } from "../types/analytics.types";

interface CategorySalesChartProps {
  data?: CategorySalesItem[];
  isLoading?: boolean;
}

export function CategorySalesChart({
  data = [],
  isLoading,
}: CategorySalesChartProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US"),
    [isAr]
  );

  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [isAr]
  );

  const chartConfig = {
    revenue: {
      label: t("analytics-revenue"),
      color: "var(--chart-1)",
    },
    count: {
      label: t("analytics-units-sold"),
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig;

  const hasSalesData = useMemo(
    () =>
      data.some(
        (item) => (item.revenue || 0) > 0 || (item.count || 0) > 0
      ),
    [data]
  );

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3 pt-5 px-6">
        <CardTitle className="text-base font-semibold text-foreground sm:text-lg flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          {t("analytics-chart-category-title")}
        </CardTitle>

        <CardDescription className="text-xs text-muted-foreground">
          {t("analytics-chart-category-desc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : data.length === 0 || !hasSalesData ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
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
            dir="ltr"
            className="h-72 w-full min-w-0"
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              barCategoryGap="30%"
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--border)"
                opacity={0.4}
              />

              <XAxis
                type="number"
                reversed={isAr}
                domain={[0, "auto"]}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={15}
                tickFormatter={(value: number) =>
                  compactFormatter.format(value)
                }
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                }}
              />

              <YAxis
                type="category"
                dataKey="category"
                orientation={isAr ? "right" : "left"}
                width={85}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{
                  fontSize: 11,
                  fill: "var(--foreground)",
                }}
              />

              <ChartTooltip
                cursor={{
                  fill: "var(--muted)",
                  opacity: 0.3,
                }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => {
                      if (name === "revenue") {
                        const formatted = numberFormatter.format(
                          Number(value)
                        );
                        return `${formatted} ${currency}`;
                      }

                      return `${value} ${t(
                        "analytics-units-sold"
                      )}`;
                    }}
                  />
                }
              />

              <Bar
                dataKey="revenue"
                fill="var(--chart-1)"
                radius={isAr ? [4, 0, 0, 4] : [0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
