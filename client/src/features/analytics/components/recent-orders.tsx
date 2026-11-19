"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
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
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">{t("analytics-status-new")}</Badge>;
      case "CONFIRMED":
      case "PROCESSING":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">{t("analytics-status-processing")}</Badge>;
      case "READY_TO_SHIP":
      case "SHIPPED":
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">{t("analytics-status-shipped")}</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">{t("analytics-status-delivered")}</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20">{t("analytics-status-cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">● {t("analytics-payment-paid")}</span>;
      case "PENDING":
        return <span className="inline-flex items-center text-[11px] font-medium text-amber-600 dark:text-amber-400">● {t("analytics-payment-pending")}</span>;
      default:
        return <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground">● {status}</span>;
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="font-serif text-lg font-semibold text-foreground sm:text-xl">
            {t("analytics-recent-orders-title")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("analytics-recent-orders-desc")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-28 text-xs font-medium">Order</TableHead>
                  <TableHead className="text-xs font-medium">Customer</TableHead>
                  <TableHead className="text-xs font-medium">Date</TableHead>
                  <TableHead className="text-xs font-medium">Amount</TableHead>
                  <TableHead className="text-xs font-medium">Payment</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {orders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString(
                    isAr ? "ar-EG" : "en-US",
                    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                  );

                  return (
                    <TableRow key={order._id} className="border-border/30 hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        #{order.orderNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium text-foreground">{order.customerInfo.fullName}</p>
                        {order.customerInfo.phone && (
                          <p className="text-[10px] text-muted-foreground" dir="ltr">
                            {order.customerInfo.phone}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                        {order.pricing.totalAmount.toLocaleString()} {currency}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getPaymentBadge(order.paymentInfo.status)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getStatusBadge(order.status)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
