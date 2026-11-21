"use client";

import { useTranslations, useLocale } from "next-intl";
import { Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { BestSellerItem } from "../types/analytics.types";

interface TopProductsProps {
  data?: BestSellerItem[];
  isLoading?: boolean;
}

export function TopProducts({ data = [], isLoading }: TopProductsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-6">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground sm:text-lg flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            {t("analytics-top-products-title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("analytics-top-products-desc")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {data.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center justify-between py-3 text-xs first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      index === 0
                        ? "bg-amber-500 text-white"
                        : index === 1
                        ? "bg-slate-400 text-white"
                        : index === 2
                        ? "bg-amber-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground line-clamp-1 max-w-[200px] sm:max-w-xs">
                      {item.name}
                    </p>
                    {item.sku && (
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {item.sku}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <p className="font-semibold text-foreground font-mono">
                    {item.totalRevenue.toLocaleString("en-US")} {currency}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.totalSold} {t("analytics-units-sold")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
