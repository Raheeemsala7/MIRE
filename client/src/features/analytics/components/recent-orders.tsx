"use client";

import { useTranslations, useLocale } from "next-intl";
import { ShoppingBag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import type { RecentOrderItem } from "../types/analytics.types";

interface RecentOrdersProps {
  orders?: RecentOrderItem[];
  isLoading?: boolean;
}

export function RecentOrders({ orders = [], isLoading }: RecentOrdersProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "NEW":
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] py-0">
            {t("analytics-status-new")}
          </Badge>
        );
      case "CONFIRMED":
      case "PROCESSING":
        return (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] py-0">
            {t("analytics-status-processing")}
          </Badge>
        );
      case "READY_TO_SHIP":
      case "SHIPPED":
        return (
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] py-0">
            {t("analytics-status-shipped")}
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-0">
            {t("analytics-status-delivered")}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] py-0">
            {t("analytics-status-cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px] py-0">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return isAr ? "ع" : "GC";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-6">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground sm:text-lg flex items-center gap-2">
            <ShoppingBag className="size-4 text-primary" />
            {t("analytics-recent-orders-title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("analytics-recent-orders-desc")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center p-5 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics-no-data")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t("analytics-empty-desc")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {orders.map((order) => {
              const rawName = order.customerInfo?.fullName;
              const customerName = rawName && rawName !== "Guest Customer"
                ? rawName
                : (isAr ? "عميل زائر" : "Guest Customer");
              const initials = getInitials(customerName);
              const fallbackContact = t("analytics-storefront-order") || (isAr ? "طلب عبر المتجر" : "Storefront Order");

              let dateStr = "";
              try {
                const date = new Date(order.createdAt);
                dateStr = isNaN(date.getTime())
                  ? ""
                  : date.toLocaleDateString(
                      isAr ? "ar-EG-u-nu-latn" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    );
              } catch {
                dateStr = "";
              }

              return (
                <div
                  key={order._id}
                  className="flex items-center justify-between gap-3 py-3 text-xs first:pt-1 last:pb-1"
                >
                  {/* Left: Avatar & Customer info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 border border-border/60 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                          {customerName}
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[130px] sm:max-w-[180px]">
                          {order.customerInfo?.email || order.customerInfo?.phone || fallbackContact}
                        </span>
                        {dateStr && (
                          <>
                            <span>·</span>
                            <span className="whitespace-nowrap">{dateStr}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0 text-end">
                    <span className="font-semibold text-foreground font-mono">
                      +{order.pricing.totalAmount.toLocaleString("en-US")} {currency}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        {order.paymentInfo.method}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
