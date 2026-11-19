"use client";

import { useTranslations, useLocale } from "next-intl";
import { CreditCard, Banknote } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { PaymentDistributionItem } from "../types/analytics.types";

interface PaymentMethodsChartProps {
  data?: PaymentDistributionItem[];
  isLoading?: boolean;
}

export function PaymentMethodsChart({ data = [], isLoading }: PaymentMethodsChartProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const getMethodDetails = (method: string) => {
    switch (method.toUpperCase()) {
      case "COD":
        return {
          label: t("analytics-method-cod"),
          icon: <Banknote className="size-4 text-emerald-600" aria-hidden="true" />,
          color: "bg-emerald-500",
        };
      case "STRIPE":
        return {
          label: t("analytics-method-stripe"),
          icon: <CreditCard className="size-4 text-sky-600" aria-hidden="true" />,
          color: "bg-sky-500",
        };
      case "PAYMOB":
        return {
          label: t("analytics-method-paymob"),
          icon: <CreditCard className="size-4 text-amber-600" aria-hidden="true" />,
          color: "bg-amber-500",
        };
      default:
        return {
          label: method || "Other",
          icon: <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />,
          color: "bg-primary",
        };
    }
  };

  const totalRevenue = data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg font-semibold text-foreground sm:text-xl">
          {t("analytics-chart-payment-title")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("analytics-chart-payment-desc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : data.length === 0 || totalRevenue === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual stacked percentage bar */}
            {totalRevenue > 0 && (
              <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted/40 p-0.5">
                {data.map((item) => {
                  const pct = Math.round((item.revenue / totalRevenue) * 100);
                  if (pct <= 0) return null;
                  const details = getMethodDetails(item.method);
                  return (
                    <div
                      key={item.method}
                      className={`h-full first:rounded-s-full last:rounded-e-full ${details.color}`}
                      style={{ width: `${pct}%` }}
                      title={`${details.label}: ${pct}%`}
                    />
                  );
                })}
              </div>
            )}

            {/* List breakdown */}
            <div className="divide-y divide-border/40">
              {data.map((item) => {
                const details = getMethodDetails(item.method);
                const revenuePct =
                  totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;

                return (
                  <div
                    key={item.method}
                    className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60">
                        {details.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{details.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.count} {t("analytics-orders-count")}
                        </p>
                      </div>
                    </div>

                    <div className="text-end">
                      <p className="font-semibold text-foreground">
                        {item.revenue.toLocaleString()} {currency}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {revenuePct}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
