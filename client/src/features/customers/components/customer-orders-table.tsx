"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import {
  formatCustomerDate,
  formatCustomerCurrency,
  getOrderStatusBadgeVariant,
  getPaymentStatusBadgeVariant,
} from "../utils/customer.util";
import type { CustomerRecentOrder } from "../types/customer.types";

interface CustomerOrdersTableProps {
  orders: CustomerRecentOrder[];
}

export function CustomerOrdersTable({ orders }: CustomerOrdersTableProps) {
  // Translation
  const t = useTranslations();
  const locale = useLocale();

  // Functions
  function getOrderStatusLabel(status: string): string {
    const key = `customers-status-${status.toLowerCase()}`;
    const translated = t(key);
    return translated || status;
  }

  function getPaymentStatusLabel(status: string): string {
    const key = `customers-payment-${status.toLowerCase()}`;
    const translated = t(key);
    return translated || status;
  }

  return (
    <Card className="border border-ds-border-subtle overflow-hidden">
      <CardHeader className="p-5 border-b border-border/60 bg-card/60 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-primary" />
          <CardTitle className="font-serif text-lg font-semibold text-foreground">
            {t("customers-orders-history-title") || "Recent Order History"}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs">
          {orders.length} {t("customers-orders-count") || "orders"}
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="size-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">
              {t("customers-orders-empty-title") || "No orders placed yet"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("customers-orders-empty-desc") ||
                "This customer profile has not completed any purchases so far."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[25%]">
                    {t("customers-order-col-number") || "Order #"}
                  </TableHead>
                  <TableHead className="w-[20%]">
                    {t("customers-order-col-date") || "Date"}
                  </TableHead>
                  <TableHead className="w-[20%]">
                    {t("customers-order-col-status") || "Order Status"}
                  </TableHead>
                  <TableHead className="w-[18%]">
                    {t("customers-order-col-payment") || "Payment"}
                  </TableHead>
                  <TableHead className="w-[17%] text-right rtl:text-left">
                    {t("customers-order-col-total") || "Total"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs font-medium">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <span>{order.orderNumber}</span>
                          <ArrowUpRight className="size-3 text-muted-foreground" />
                        </Link>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatCustomerDate(order.createdAt, locale)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getOrderStatusBadgeVariant(order.status)}
                          className="text-[11px] font-medium uppercase tracking-wider"
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">
                            {order.paymentInfo?.method || "COD"}
                          </span>
                          {order.paymentInfo?.status && (
                            <Badge
                              variant={getPaymentStatusBadgeVariant(
                                order.paymentInfo.status
                              )}
                              className="text-[10px] w-fit px-1.5 py-0 uppercase"
                            >
                              {getPaymentStatusLabel(order.paymentInfo.status)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right rtl:text-left font-medium text-xs text-foreground">
                        {formatCustomerCurrency(
                          order.pricing?.totalAmount,
                          locale
                        )}
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
