"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  CreditCard,
  RotateCcw,
  MessageCircle,
  Copy,
  Check,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/src/shared/stores/cart-store";
import { canCustomerRequestReturn } from "@/features/returns/utils/return-eligibility.util";
import type { OrderDisplay } from "../types/order";

const ORDER_STEPS = [
  { key: "NEW", labelAr: "تم استلام الطلب", labelEn: "Order Placed", icon: Box },
  { key: "CONFIRMED", labelAr: "تم التأكيد", labelEn: "Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", labelAr: "قيد التجهيز والتغليف", labelEn: "Processing", icon: Clock },
  { key: "SHIPPED", labelAr: "خرج للتوصيل مع المندوب", labelEn: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", labelAr: "تم التوصيل بنجاح", labelEn: "Delivered", icon: Check },
];

function getStepIndex(status: string): number {
  switch (status?.toUpperCase()) {
    case "NEW":
      return 1;
    case "CONFIRMED":
      return 2;
    case "PROCESSING":
    case "READY_TO_SHIP":
      return 3;
    case "SHIPPED":
      return 4;
    case "DELIVERED":
      return 5;
    case "CANCELLED":
    case "RETURNED":
      return 0;
    default:
      return 1;
  }
}

interface CustomerOrderDetailViewProps {
  order: OrderDisplay;
  backHref?: string;
}

export function CustomerOrderDetailView({
  order,
  backHref = "/orders",
}: CustomerOrderDetailViewProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { addItem, setIsOpen: setCartOpen } = useCartStore();
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    toast.success(isAr ? "تم نسخ رقم الطلب" : "Order number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReorder = () => {
    for (const it of order.items) {
      addItem({
        id: it.id || `reorder-${Date.now()}-${Math.random()}`,
        title: it.name,
        color: it.color || (isAr ? "كلاسيكي" : "Classic"),
        size: it.size || "M",
        price: it.unitPrice || 850,
        image: it.image || "/products/abaya.jpg",
        quantity: it.quantity || 1,
      });
    }
    toast.success(
      isAr
        ? "تمت إضافة منتجات الطلب إلى حقيبة التسوق"
        : "Order items re-added to your bag"
    );
    setCartOpen(true);
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status?.toUpperCase() === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ds-text-muted hover:text-ds-text-plain transition-colors"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span>{isAr ? "العودة إلى قائمة الطلبات" : "Back to Orders"}</span>
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated shadow-xs overflow-hidden">
        {/* Header Section */}
        <div className="p-6 sm:p-8 border-b border-ds-border-muted/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xl sm:text-2xl font-bold text-ds-text-plain tracking-wider">
                  #{order.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="size-7 rounded-lg hover:bg-ds-subtle flex items-center justify-center text-ds-text-soft transition-colors cursor-pointer"
                  title={isAr ? "نسخ رقم الطلب" : "Copy order number"}
                >
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </button>
              </div>

              {order.createdAt && (
                <p className="mt-1 text-xs text-ds-text-muted">
                  {isAr ? "تاريخ تسجيل الطلب: " : "Placed on: "}
                  {new Date(order.createdAt).toLocaleDateString(
                    isAr ? "ar-EG" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-ds-primary/10 text-ds-primary border border-ds-primary/20">
                {order.status}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {isCancelled ? (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              <span>{isAr ? "تم إلغاء هذا الطلب" : "This order has been cancelled"}</span>
            </div>
          ) : (
            <div className="py-4">
              <div className="relative flex items-center justify-between">
                <div className="absolute top-4 start-4 end-4 h-0.5 bg-ds-border-muted/60 -z-0" />
                <div
                  className="absolute top-4 start-4 h-0.5 bg-ds-primary transition-all duration-500 -z-0"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (ORDER_STEPS.length - 1)) * 100))}%`,
                  }}
                />

                {ORDER_STEPS.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isDone = currentStep > stepNum;
                  const isCurrent = currentStep === stepNum;
                  const IconComponent = step.icon;

                  return (
                    <div
                      key={step.key}
                      className="flex flex-col items-center text-center relative z-10 min-w-16 sm:min-w-20"
                    >
                      <div
                        className={`size-8 sm:size-9 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-ds-primary text-white shadow-xs"
                            : isCurrent
                            ? "bg-ds-primary text-white ring-4 ring-ds-primary/20 shadow-sm"
                            : "bg-ds-plain border border-ds-border-muted text-ds-text-soft"
                        }`}
                      >
                        <IconComponent className="size-4" />
                      </div>
                      <span
                        className={`mt-2 text-[10px] sm:text-[11px] leading-tight font-medium max-w-18 sm:max-w-24 ${
                          isCurrent
                            ? "text-ds-primary font-bold"
                            : isDone
                            ? "text-ds-text-plain"
                            : "text-ds-text-soft"
                        }`}
                      >
                        {isAr ? step.labelAr : step.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Items Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ds-text-muted">
              {isAr ? "المنتجات المطلوبة" : "Ordered Items"}
            </h2>

            <div className="divide-y divide-ds-border-muted/60 rounded-2xl border border-ds-border-muted bg-ds-plain overflow-hidden">
              {order.items.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="flex items-center justify-between p-4 text-xs gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-xl bg-ds-subtle flex items-center justify-center shrink-0 border border-ds-border-muted/60">
                      <Package className="size-5 text-ds-text-soft" />
                    </div>
                    <div>
                      <p className="font-semibold text-ds-text-plain">{it.name}</p>
                      <p className="text-ds-text-soft mt-0.5">
                        {it.color ? `${it.color} • ` : ""}
                        {it.size ? `${it.size} • ` : ""}
                        x{it.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-ds-primary text-sm">
                    {it.subtotal || it.unitPrice * it.quantity} {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Address */}
            <div className="rounded-2xl border border-ds-border-muted p-5 space-y-2 text-xs text-ds-text-muted bg-ds-plain">
              <span className="font-semibold text-ds-text-plain flex items-center gap-1.5 mb-2">
                <MapPin className="size-4 text-ds-primary" />
                {isAr ? "عنوان التوصيل المحدد" : "Delivery Address"}
              </span>
              {order.customerInfo && (
                <p className="font-medium text-ds-text-plain">
                  {order.customerInfo.fullName} • {order.customerInfo.phone}
                </p>
              )}
              {order.shippingAddress && (
                <p>
                  {order.shippingAddress.governorate}، {order.shippingAddress.city}، {order.shippingAddress.street}
                  {order.shippingAddress.building ? `، عمارة ${order.shippingAddress.building}` : ""}
                  {order.shippingAddress.apartment ? `، شقة ${order.shippingAddress.apartment}` : ""}
                  {order.shippingAddress.landmark ? ` (${order.shippingAddress.landmark})` : ""}
                </p>
              )}
            </div>

            {/* Payment Details */}
            <div className="rounded-2xl border border-ds-border-muted p-5 space-y-2 text-xs text-ds-text-muted bg-ds-plain">
              <span className="font-semibold text-ds-text-plain flex items-center gap-1.5 mb-2">
                <CreditCard className="size-4 text-ds-primary" />
                {isAr ? "تفاصيل الدفع والتكلفة" : "Payment & Billing"}
              </span>
              <div className="flex justify-between">
                <span>{isAr ? "طريقة الدفع:" : "Method:"}</span>
                <span className="font-semibold text-ds-text-plain">
                  {order.paymentInfo?.method === "PAYMOB"
                    ? isAr ? "بطاقة بنكية (Paymob)" : "Card (Paymob)"
                    : isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? "المجموع الفرعي:" : "Subtotal:"}</span>
                <span className="font-mono">{order.pricing?.subtotal || 0} {isAr ? "ج.م" : "EGP"}</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? "الشحن:" : "Shipping:"}</span>
                <span className="font-mono">
                  {order.pricing?.shippingFee === 0
                    ? isAr ? "مجاني" : "Free"
                    : `${order.pricing?.shippingFee || 50} ${isAr ? "ج.م" : "EGP"}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-ds-border-muted/60 pt-2 font-bold text-sm text-ds-text-plain">
                <span>{isAr ? "المجموع الكلي:" : "Total Amount:"}</span>
                <span className="font-mono text-ds-primary">
                  {order.pricing?.totalAmount || 0} {isAr ? "ج.م" : "EGP"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ds-border-muted">
            <a
              href={`https://wa.me/201012345678?text=${encodeURIComponent(
                isAr
                  ? `مرحباً، أود الاستفسار عن حالة طلبي رقم: ${order.orderNumber}`
                  : `Hello, I'd like to check on my order: ${order.orderNumber}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <MessageCircle className="size-4" />
              <span>{isAr ? "مساعدة فورية عبر واتساب" : "WhatsApp Support"}</span>
            </a>

            <div className="flex items-center gap-2">
              {canCustomerRequestReturn(order).eligible && (
                <Link
                  href={`/account/returns/request?orderId=${order._id || order.orderNumber}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 hover:border-primary text-xs font-semibold text-primary transition-all shadow-2xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{isAr ? "طلب إرجاع" : "Request Return"}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleReorder}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>{isAr ? "إعادة طلب هذه القطع" : "Re-order Items"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
