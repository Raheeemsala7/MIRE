"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Search,
  Package,
  AlertCircle,
  RotateCcw,
  User,
  Phone,
  Calendar,
  CreditCard,
  ShieldAlert,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import type { OrderDoc } from "@/features/admin/orders/types/order-admin.types";
import {
  RETURN_REASONS,
  REFUND_METHODS,
  type ReturnReason,
  type RefundMethod,
} from "../../types/return.types";
import {
  formatCurrency,
  formatDate,
  REASON_CONFIG,
  REFUND_METHOD_CONFIG,
} from "../../utils/return.util";
import {
  canAdminCreateReturn,
} from "../../utils/return-eligibility.util";
import {
  requestReturnSchema,
  type RequestReturnSchemaInput,
} from "../../schemas/return.schema";
import { searchAdminOrdersForReturnAction } from "../../actions/return.actions";
import { useAdminCreateReturn } from "../../hooks/use-admin-create-return";

interface AdminReturnCreateFormProps {
  locale: string;
  initialOrders: OrderDoc[];
  userRole?: string;
  preselectedOrderId?: string;
}

export function AdminReturnCreateForm({
  locale,
  initialOrders = [],
  userRole = "ADMIN",
  preselectedOrderId,
}: AdminReturnCreateFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isAr = locale === "ar";

  // State
  const [orders, setOrders] = useState<OrderDoc[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    preselectedOrderId || (initialOrders.length > 0 ? initialOrders[0]._id : "")
  );

  // Selected items mapping: sku -> quantity
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, number>>({});

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RequestReturnSchemaInput>({
    resolver: zodResolver(requestReturnSchema),
    defaultValues: {
      originalOrderId: selectedOrderId,
      items: [],
      reason: RETURN_REASONS.SIZE_TOO_LARGE,
      reasonDetails: "",
      refundMethod: REFUND_METHODS.CASH,
    },
  });

  const selectedReason = watch("reason");
  const selectedRefundMethod = watch("refundMethod");

  // Server-side interactive search when query is typed
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        setIsSearchingServer(true);
        const res = await searchAdminOrdersForReturnAction(trimmed);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setOrders((prev) => {
            const map = new Map(prev.map((o) => [o._id, o]));
            for (const order of res.data as OrderDoc[]) {
              if (!map.has(order._id)) {
                map.set(order._id, order);
              }
            }
            return Array.from(map.values());
          });
        }
      } catch {
        // graceful ignore error
      } finally {
        setIsSearchingServer(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered orders list based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerInfo?.fullName?.toLowerCase().includes(q) ||
        o.customerInfo?.phone?.includes(q)
    );
  }, [orders, searchQuery]);

  // Current selected order
  const currentOrder = useMemo(
    () => orders.find((o) => o._id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  // Check admin eligibility for the selected order
  const eligibility = useMemo(
    () => canAdminCreateReturn(currentOrder, userRole),
    [currentOrder, userRole]
  );

  // Mutation
  const { mutate: createReturn, isPending } = useAdminCreateReturn((response) => {
    if (response?.data?._id) {
      router.push(`/admin/returns/${response.data._id}`);
    } else {
      router.push("/admin/returns");
    }
  });

  // Keep form's originalOrderId and items synchronized
  React.useEffect(() => {
    if (!currentOrder) {
      setValue("originalOrderId", "");
      setValue("items", []);
      return;
    }

    setValue("originalOrderId", currentOrder._id);

    const formattedItems = Object.entries(selectedItemsMap)
      .filter(([, qty]) => qty > 0)
      .map(([sku, qty]) => {
        const orderItem = currentOrder.items.find((i) => i.sku === sku);
        if (!orderItem) return null;
        const prod = orderItem.product as unknown;
        const productId =
          typeof prod === "object" && prod !== null && "_id" in prod && typeof (prod as { _id: unknown })._id === "string"
            ? (prod as { _id: string })._id
            : typeof prod === "string" && (prod as string).length > 0
            ? (prod as string)
            : orderItem._id || orderItem.sku;

        return {
          productId,
          sku: orderItem.sku,
          color: orderItem.color || "Standard",
          size: orderItem.size || "Standard",
          quantity: qty,
          unitPrice: orderItem.unitPrice,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    setValue("items", formattedItems);
  }, [currentOrder, selectedItemsMap, setValue]);

  // Handlers
  function handleSelectOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setSelectedItemsMap({});
  }

  function handleToggleItem(sku: string) {
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (next[sku]) {
        delete next[sku];
      } else {
        next[sku] = 1;
      }
      return next;
    });
  }

  function handleUpdateQuantity(sku: string, delta: number, maxQty: number) {
    setSelectedItemsMap((prev) => {
      const current = prev[sku] || 1;
      const nextQty = Math.max(1, Math.min(maxQty, current + delta));
      return { ...prev, [sku]: nextQty };
    });
  }

  // Calculate estimated refund
  const estimatedRefund = useMemo(() => {
    if (!currentOrder) return 0;
    let total = 0;
    for (const [sku, qty] of Object.entries(selectedItemsMap)) {
      const item = currentOrder.items.find((i) => i.sku === sku);
      if (item) {
        total += item.unitPrice * qty;
      }
    }
    return total;
  }, [currentOrder, selectedItemsMap]);

  const selectedCount = Object.keys(selectedItemsMap).length;

  function onSubmit(values: RequestReturnSchemaInput) {
    createReturn(values);
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/returns"
            className="flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground shadow-2xs hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("returns-create-title") || "Create Return Request"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("returns-create-desc") ||
                "Create a return request on behalf of a customer for an eligible order."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Order Selection & Details */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <span>{t("returns-select-order") || "Select Customer Order"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t("returns-select-order-desc") ||
                "Search and pick a customer order to process a return"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {/* Search Filter Input */}
            <div className="relative">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={
                  t("returns-search-order-placeholder") ||
                  "Search order by # or customer phone..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 pe-10 h-10 text-sm"
              />
              {isSearchingServer && (
                <Loader2 className="absolute end-3.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-primary" />
              )}
            </div>

            {/* Order Select Dropdown */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {isAr ? "الطلب المحدد:" : "Selected Order:"}
              </Label>
              <Select
                value={selectedOrderId}
                onValueChange={handleSelectOrder}
              >
                <SelectTrigger className="w-full h-11 text-sm font-medium">
                  <SelectValue placeholder={isAr ? "اختر طلباً..." : "Select an order..."} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {filteredOrders.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {isAr ? "لا توجد طلبات مطابقة" : "No matching orders found"}
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <SelectItem key={order._id} value={order._id}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold" dir="ltr">
                            #{order.orderNumber}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span>{order.customerInfo?.fullName || "Guest"}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-mono" dir="ltr">{order.customerInfo?.phone}</span>
                          <span className="text-muted-foreground">·</span>
                          <Badge
                            variant={order.status === "DELIVERED" ? "default" : "secondary"}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Order Summary Card */}
            {currentOrder && (
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    <span className="font-mono font-bold text-sm text-foreground" dir="ltr">
                      #{currentOrder.orderNumber}
                    </span>
                    <Badge
                      className={`text-xs ${
                        currentOrder.status === "DELIVERED"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {currentOrder.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span dir="ltr">{formatDate(currentOrder.createdAt, locale)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 text-primary" />
                    <span className="text-foreground font-medium">
                      {currentOrder.customerInfo?.fullName || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5 text-primary" />
                    <span className="font-mono" dir="ltr">
                      {currentOrder.customerInfo?.phone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="size-3.5 text-primary" />
                    <span>
                      {isAr ? "الإجمالي:" : "Total:"}{" "}
                      <strong className="text-foreground font-mono" dir="ltr">
                        {formatCurrency(currentOrder.pricing?.totalAmount || 0, locale)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Eligibility Notice */}
                {!eligibility.eligible && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-destructive flex items-start gap-2.5 text-xs mt-2">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {isAr ? "الطلب غير مؤهل لإنشاء الإرجاع" : "Order Ineligible for Return"}
                      </p>
                      <p className="mt-0.5 text-destructive/90">
                        {isAr ? eligibility.messageAr : eligibility.messageEn}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Return Items Selection */}
        {currentOrder && eligibility.eligible && (
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </span>
                <span>{t("returns-items-to-return") || "Items to Return"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t("returns-select-items-desc") ||
                  "Select the items and quantities the customer wants to return"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <div className="divide-y divide-border/60 rounded-2xl border border-border/80 overflow-hidden">
                {currentOrder.items.map((item) => {
                  const isSelected = Boolean(selectedItemsMap[item.sku]);
                  const returnQty = selectedItemsMap[item.sku] || 1;

                  return (
                    <div
                      key={item.sku}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isSelected ? "bg-primary/5" : "bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`item-${item.sku}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleItem(item.sku)}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <label
                            htmlFor={`item-${item.sku}`}
                            className="text-sm font-semibold text-foreground cursor-pointer"
                          >
                            {item.name}
                          </label>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span>SKU: {item.sku}</span>
                            <span>·</span>
                            <span>{item.color}</span>
                            <span>·</span>
                            <span>{item.size}</span>
                            <span>·</span>
                            <span className="text-foreground font-medium">
                              {formatCurrency(item.unitPrice, locale)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {isAr ? "الكمية المشتراة:" : "Purchased qty:"}{" "}
                            <span className="font-semibold text-foreground font-mono">
                              {item.quantity}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      {isSelected && (
                        <div className="flex items-center gap-3 ps-7 sm:ps-0">
                          <span className="text-xs text-muted-foreground">
                            {isAr ? "الكمية المرتجعة:" : "Return Qty:"}
                          </span>
                          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background p-1 shadow-2xs">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg"
                              disabled={returnQty <= 1}
                              onClick={() => handleUpdateQuantity(item.sku, -1, item.quantity)}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-8 text-center font-mono text-xs font-bold">
                              {returnQty}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg"
                              disabled={returnQty >= item.quantity}
                              onClick={() => handleUpdateQuantity(item.sku, 1, item.quantity)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                          <span className="text-xs font-mono font-semibold text-primary min-w-16 text-end" dir="ltr">
                            {formatCurrency(item.unitPrice * returnQty, locale)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {errors.items && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3.5" />
                  <span>{errors.items.message}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Return Reason & Refund Method */}
        {currentOrder && eligibility.eligible && (
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </span>
                <span>{t("returns-reason-and-refund") || "Return Details & Refund"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reason Select */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    {t("returns-select-reason") || "Return Reason"} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedReason}
                    onValueChange={(val) => setValue("reason", val as ReturnReason)}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RETURN_REASONS).map((reasonKey) => (
                        <SelectItem key={reasonKey} value={reasonKey}>
                          {isAr
                            ? REASON_CONFIG[reasonKey]?.labelAr
                            : REASON_CONFIG[reasonKey]?.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Refund Method Select */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    {t("returns-refund-method") || "Refund Method"} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedRefundMethod}
                    onValueChange={(val) => setValue("refundMethod", val as RefundMethod)}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(REFUND_METHODS).map((methodKey) => (
                        <SelectItem key={methodKey} value={methodKey}>
                          {isAr
                            ? REFUND_METHOD_CONFIG[methodKey]?.labelAr
                            : REFUND_METHOD_CONFIG[methodKey]?.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reason Details Textarea */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  {t("returns-reason-details") || "Reason Notes (Optional)"}
                </Label>
                <Textarea
                  placeholder={
                    t("returns-reason-details-placeholder") ||
                    "Enter additional context or notes from the customer..."
                  }
                  {...register("reasonDetails")}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Summary & Submit Action */}
        {currentOrder && eligibility.eligible && (
          <Card className="border-border/60 bg-muted/10 shadow-xs">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </span>
                <span>{t("returns-review-summary") || "Review & Submit"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background p-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("returns-selected-items-count") || "Selected Items"}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {selectedCount} {isAr ? "منتجات" : "items"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground text-end">
                    {t("returns-total-refund") || "Total Estimated Refund"}
                  </p>
                  <p className="text-xl font-bold text-primary font-mono text-end" dir="ltr">
                    {formatCurrency(estimatedRefund, locale)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/returns")}
                  disabled={isPending}
                  className="rounded-xl"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>

                <Button
                  type="submit"
                  disabled={selectedCount === 0 || isPending || !eligibility.eligible}
                  className="rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin me-2" />
                      <span>{t("returns-submitting") || "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-4 me-2" />
                      <span>{t("returns-submit-button") || "Submit Return Request"}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
