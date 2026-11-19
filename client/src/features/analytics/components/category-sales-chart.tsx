"use client";

import { useTranslations, useLocale } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
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

export function CategorySalesChart({ data = [], isLoading }: CategorySalesChartProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

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

  const hasSalesData = data.some((d) => (d.revenue || 0) > 0 || (d.count || 0) > 0);

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg font-semibold text-foreground sm:text-xl">
          {t("analytics-chart-category-title")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("analytics-chart-category-desc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-60 w-full rounded-xl" />
        ) : data.length === 0 || !hasSalesData ? (
          <div className="flex h-56 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: isAr ? 10 : 20, left: isAr ? 20 : 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.4} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val.toLocaleString()} ${currency}`}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                  orientation={isAr ? "right" : "left"}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                  content={
                    <ChartTooltipContent
                      formatter={(val, name) => {
                        if (name === "revenue") {
                          return `${Number(val).toLocaleString()} ${currency}`;
                        }
                        return `${val} ${t("analytics-units-sold")}`;
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--chart-1)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
