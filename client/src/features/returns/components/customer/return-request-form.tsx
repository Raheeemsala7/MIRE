"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { requestReturnSchema, type RequestReturnSchemaInput } from "../../schemas/return.schema";
import {
  RETURN_REASONS,
  REFUND_METHODS,
  type ReturnReason,
  type RefundMethod,
  type ReturnDoc,
} from "../../types/return.types";
import {
  formatCurrency,
  formatDate,
  REASON_CONFIG,
  REFUND_METHOD_CONFIG,
} from "../../utils/return.util";
import {
  fetchCustomerDeliveredOrders,
} from "../../services/returns.service";
import { returnQueryKeys } from "../../hooks/use-returns";
import { useSubmitReturnRequest } from "../../hooks/use-submit-return-request";
import { ReturnRequestSuccess } from "./return-request-success";

interface ReturnRequestFormProps {
  locale?: string;
}

export function ReturnRequestForm({ locale = "en" }: ReturnRequestFormProps) {
  const isAr = locale === "ar";

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: returnQueryKeys.deliveredOrders(),
    queryFn: () => fetchCustomerDeliveredOrders(),
    staleTime: 1000 * 60,
  });

  const orders = useMemo(() => ordersData?.data || [], [ordersData?.data]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [submittedReturn, setSubmittedReturn] = useState<ReturnDoc | null>(null);

  const [selectedReason, setSelectedReason] = useState<ReturnReason>(
    RETURN_REASONS.SIZE_TOO_LARGE
  );
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<RefundMethod>(
    REFUND_METHODS.CASH
  );

  // Selected item tracking: itemId -> quantity
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, number>>({});

  const { mutate: submitRequest, isPending: isSubmitting } = useSubmitReturnRequest((res) => {
    setSubmittedReturn(res.data);
  });

  // Default selected order to the first delivered order when loaded
  const effectiveOrderId = selectedOrderId || (orders.length > 0 ? orders[0]._id : "");

  const currentOrder = useMemo(
    () => orders.find((o) => o._id === effectiveOrderId),
    [orders, effectiveOrderId]
  );

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequestReturnSchemaInput>({
    resolver: zodResolver(requestReturnSchema),
    defaultValues: {
      originalOrderId: "",
      items: [],
      reason: RETURN_REASONS.SIZE_TOO_LARGE,
      reasonDetails: "",
      refundMethod: REFUND_METHODS.CASH,
    },
  });

  // Keep form's originalOrderId and items synchronized when order or selected items change
  useEffect(() => {
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
        return {
          productId: orderItem.product,
          sku: orderItem.sku,
          color: orderItem.color,
          size: orderItem.size,
          quantity: qty,
          unitPrice: orderItem.unitPrice,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    setValue("items", formattedItems);
  }, [currentOrder, selectedItemsMap, setValue]);

  // When order changes, reset item selection
  function handleOrderSelect(orderId: string) {
    setSelectedOrderId(orderId);
    setSelectedItemsMap({});
  }

  function handleItemToggle(sku: string) {
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (next[sku]) {
        delete next[sku];
      } else {
        next[sku] = 1; // default to 1 item
      }
      return next;
    });
  }

  function handleQuantityChange(sku: string, qty: number, maxQty: number) {
    const clamped = Math.max(1, Math.min(qty, maxQty));
    setSelectedItemsMap((prev) => ({
      ...prev,
      [sku]: clamped,
    }));
  }

  const selectedItemsCount = Object.keys(selectedItemsMap).length;

  const estimatedRefund = useMemo(() => {
    if (!currentOrder) return 0;
    let sum = 0;
    for (const [sku, qty] of Object.entries(selectedItemsMap)) {
      const item = currentOrder.items.find((i) => i.sku === sku);
      if (item) {
        sum += item.unitPrice * qty;
      }
    }
    return sum;
  }, [currentOrder, selectedItemsMap]);

  function onSubmit(values: RequestReturnSchemaInput) {
    submitRequest(values);
  }

  // If successfully submitted, show receipt view
  if (submittedReturn) {
    return <ReturnRequestSuccess returnDoc={submittedReturn} locale={locale} />;
  }

  if (isLoadingOrders) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">
          {isAr ? "جاري تحميل الطلبات المؤهلة للإرجاع..." : "Loading eligible delivered orders..."}
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-xl text-center rounded-3xl border border-dashed border-border p-12 bg-card/60 shadow-xs">
        <Package className="mx-auto size-12 text-muted-foreground/60" />
        <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
          {isAr ? "لا توجد طلبات مستلمة مؤهلة" : "No Eligible Delivered Orders Found"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAr
            ? "يمكن تقديم طلبات الإرجاع فقط للطلبات التي تم توصيلها بنجاح وخلال فترة الإرجاع المسموحة (14 يوماً)."
            : "Returns can only be requested for orders that have been successfully delivered within the 14-day return window."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
      {/* Step 1: Select Delivered Order */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            <span>{isAr ? "اختيار الطلب المستلم" : "Select Delivered Order"}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "اختاري الطلب الذي ترغبين في إرجاع بعض أو كل منتجاته" : "Choose the delivered order containing items you wish to return"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <Select
            value={effectiveOrderId}
            onValueChange={handleOrderSelect}
          >
            <SelectTrigger className="w-full h-11 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orders.map((order) => (
                <SelectItem key={order._id} value={order._id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold" dir="ltr">#{order.orderNumber}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {formatDate(order.createdAt, locale)}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs font-medium" dir="ltr">
                      {formatCurrency(order.pricing.totalAmount, locale)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Select Items & Quantities */}
      {currentOrder && (
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <span>{isAr ? "اختيار المنتجات المراد إرجاعها" : "Select Items to Return"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr ? "حددي المنتجات والكمية المطلوبة لكل قطعة" : "Check items and select quantity"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
              {currentOrder.items.map((item) => {
                const isSelected = Boolean(selectedItemsMap[item.sku]);
                const currentQty = selectedItemsMap[item.sku] || 1;

                return (
                  <div
                    key={item.sku}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`check-${item.sku}`}
                        checked={isSelected}
                        onCheckedChange={() => handleItemToggle(item.sku)}
                        className="mt-1"
                      />
                      <label htmlFor={`check-${item.sku}`} className="cursor-pointer space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                          SKU: {item.sku} · {item.color} / {item.size} · Ordered: {item.quantity}
                        </p>
                        <p className="text-xs font-semibold text-foreground" dir="ltr">
                          {formatCurrency(item.unitPrice, locale)} {isAr ? "للقطعة" : "each"}
                        </p>
                      </label>
                    </div>

                    {/* Quantity Selector if selected */}
                    {isSelected && (
                      <div className="flex items-center gap-2 ps-7 sm:ps-0">
                        <Label className="text-xs text-muted-foreground">
                          {isAr ? "الكمية:" : "Qty:"}
                        </Label>
                        <select
                          value={currentQty}
                          onChange={(e) =>
                            handleQuantityChange(item.sku, Number(e.target.value), item.quantity)
                          }
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs font-semibold"
                        >
                          {Array.from({ length: item.quantity }, (_, idx) => idx + 1).map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {errors.items && (
              <p className="text-xs text-destructive">
                {isAr ? "يرجى تحديد منتج واحد على الأقل للإرجاع" : "At least one item must be selected"}
              </p>
            )}

            {/* Estimated Refund Total */}
            {selectedItemsCount > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {isAr ? "المبلغ المسترد التقديري:" : "Estimated Refund Total:"}
                </span>
                <span className="font-bold text-sm text-foreground" dir="ltr">
                  {formatCurrency(estimatedRefund, locale)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Reason & Refund Method */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            <span>{isAr ? "سبب الإرجاع وتفاصيل الاسترداد" : "Return Reason & Refund Preference"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {/* Reason Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isAr ? "سبب الإرجاع الرئيسي (مطلوب):" : "Return Reason (Required):"}
            </Label>
            <Select
              value={selectedReason}
              onValueChange={(val) => {
                const r = val as ReturnReason;
                setSelectedReason(r);
                setValue("reason", r);
              }}
            >
              <SelectTrigger className="w-full h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(RETURN_REASONS).map((reason) => {
                  const cfg = REASON_CONFIG[reason];
                  return (
                    <SelectItem key={reason} value={reason}>
                      <span>{isAr ? cfg.labelAr : cfg.labelEn}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Additional details */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isAr ? "توضيح إضافي (اختياري):" : "Additional details (optional):"}
            </Label>
            <Textarea
              {...register("reasonDetails")}
              placeholder={
                isAr
                  ? "أضيفي أي تفاصيل إضافية عن المقاس أو العيب لمساعدتنا في تحسين خدماتنا..."
                  : "Provide any additional details about fit, defect, or feedback..."
              }
              rows={3}
              className="text-xs"
            />
          </div>

          {/* Refund Method */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isAr ? "طريقة استرداد المبلغ:" : "Refund Preference:"}
            </Label>
            <Select
              value={selectedRefundMethod}
              onValueChange={(val) => {
                const m = val as RefundMethod;
                setSelectedRefundMethod(m);
                setValue("refundMethod", m);
              }}
            >
              <SelectTrigger className="w-full h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(REFUND_METHODS).map((method) => {
                  const cfg = REFUND_METHOD_CONFIG[method];
                  return (
                    <SelectItem key={method} value={method}>
                      <span>{isAr ? cfg.labelAr : cfg.labelEn}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={selectedItemsCount === 0 || isSubmitting}
        className="w-full h-12 text-sm font-semibold rounded-full shadow-md"
      >
        {isSubmitting ? (
          <span>{isAr ? "جاري إرسال طلب الإرجاع..." : "Submitting Return Request..."}</span>
        ) : (
          <span className="flex items-center gap-2">
            <span>{isAr ? "إرسال طلب الإرجاع" : "Submit Return Request"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </span>
        )}
      </Button>
    </form>
  );
}
