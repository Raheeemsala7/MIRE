"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  PackageCheck,
  Clock,
  Truck,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export interface OrderTrackingTimelineProps {
  orderNumber: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  customerName?: string;
  customerPhone?: string;
  shippingCity?: string;
  shippingGovernorate?: string;
  estimatedDelivery?: string;
  className?: string;
}

interface TimelineStep {
  key: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    key: "NEW",
    labelAr: "تم استلام الطلب",
    labelEn: "Order Received",
    descAr: "تم تسجيل طلبك بنجاح في نظامنا",
    descEn: "Order placed and logged in our system",
    icon: PackageCheck,
  },
  {
    key: "PROCESSING",
    labelAr: "قيد التجهيز والتغليف",
    labelEn: "Processing & Packing",
    descAr: "جاري مراجعة المقاسات وتجهيز القطع بعناية",
    descEn: "Items inspected, packaged and prepared",
    icon: Clock,
  },
  {
    key: "SHIPPED",
    labelAr: "تم الشحن",
    labelEn: "Shipped",
    descAr: "تم تسليم الشحنة لشركة التوصيل",
    descEn: "Package handed over to shipping courier",
    icon: Truck,
  },
  {
    key: "OUT_FOR_DELIVERY",
    labelAr: "مع المندوب للتوصيل",
    labelEn: "Out for Delivery",
    descAr: "المندوب في طريقه إلى عنوانك اليوم",
    descEn: "Courier is on the way to your address",
    icon: MapPin,
  },
  {
    key: "DELIVERED",
    labelAr: "تم التوصيل بنجاح",
    labelEn: "Delivered",
    descAr: "تم استلام الطلب والدفع بنجاح",
    descEn: "Order delivered and confirmed",
    icon: CheckCircle2,
  },
];

function getStatusStepIndex(status: string): number {
  switch (status?.toUpperCase()) {
    case "NEW":
      return 0;
    case "CONFIRMED":
    case "PROCESSING":
      return 1;
    case "READY_TO_SHIP":
    case "SHIPPED":
      return 2;
    case "OUT_FOR_DELIVERY":
      return 3;
    case "DELIVERED":
      return 4;
    case "CANCELLED":
    case "RETURNED":
      return -1;
    default:
      return 0;
  }
}

export function OrderTrackingTimeline({
  orderNumber,
  status,
  createdAt,
  updatedAt,
  customerName,
  customerPhone,
  shippingCity,
  shippingGovernorate,
  estimatedDelivery,
  className = "",
}: OrderTrackingTimelineProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [copied, setCopied] = useState(false);

  const stepIndex = getStatusStepIndex(status);
  const isCancelled = status?.toUpperCase() === "CANCELLED";
  const isReturned = status?.toUpperCase() === "RETURNED";

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    toast.success(isAr ? "تم نسخ رقم الطلب" : "Order number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const whatsappMessage = encodeURIComponent(
    isAr
      ? `مرحباً ميري، أود الاستفسار عن حالة طلبي رقم #${orderNumber}`
      : `Hello MIRÉ, I'd like to check on my order #${orderNumber}`
  );

  return (
    <div
      className={`rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8 shadow-xs space-y-6 ${className}`}
    >
      {/* Header with Tracking Number & WhatsApp Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-ds-border-muted">
        <div>
          <span className="text-xs font-medium text-ds-text-soft">
            {isAr ? "رقم تتبع الشحنة" : "Shipment Tracking Number"}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-lg sm:text-xl font-bold text-ds-primary tracking-wider">
              {orderNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-ds-border-muted bg-ds-plain text-ds-text-soft hover:text-ds-primary hover:border-ds-primary transition-colors cursor-pointer"
              title={isAr ? "نسخ رقم الشحنة" : "Copy tracking number"}
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/201000000000?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageCircle className="size-4" />
            <span>{isAr ? "تواصل مع المندوب" : "Chat on WhatsApp"}</span>
          </a>
        </div>
      </div>

      {/* Cancelled or Returned Alert */}
      {isCancelled && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-600 flex items-center gap-3 text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <span>{isAr ? "تم إلغاء هذا الطلب. للمزيد من التفاصيل يرجى التواصل مع خدمة العملاء." : "This order has been cancelled. Contact support for details."}</span>
        </div>
      )}

      {isReturned && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-600 flex items-center gap-3 text-sm">
          <RotateCcw className="size-5 shrink-0" />
          <span>{isAr ? "تم تسجيل طلب إرجاع لهذه الشحنة." : "A return request has been filed for this order."}</span>
        </div>
      )}

      {/* Main Interactive Stepper Timeline */}
      {!isCancelled && !isReturned && (
        <div className="py-4">
          <div className="relative">
            {/* Background connection track */}
            <div className="absolute top-5 start-6 end-6 h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0 hidden sm:block" />

            {/* Filled active track */}
            <div
              className="absolute top-5 start-6 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 -translate-y-1/2 z-0 transition-all duration-700 hidden sm:block"
              style={{
                width: `${Math.min(100, Math.max(0, (stepIndex / (TIMELINE_STEPS.length - 1)) * 100))}%`,
              }}
            />

            {/* Steps Container */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
              {TIMELINE_STEPS.map((step, idx) => {
                const IconComponent = step.icon;
                const isPassed = stepIndex > idx;
                const isCurrent = stepIndex === idx;
                const isUpcoming = stepIndex < idx;

                return (
                  <div
                    key={step.key}
                    className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2"
                  >
                    {/* Circle Node */}
                    <div
                      className={`relative flex size-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        isPassed
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20"
                          : isCurrent
                          ? "bg-amber-500 text-white ring-4 ring-amber-500/30 scale-110 shadow-lg"
                          : "bg-ds-plain border-2 border-ds-border-muted text-ds-text-soft"
                      }`}
                    >
                      {isPassed ? (
                        <Check className="size-4 stroke-[3]" />
                      ) : (
                        <IconComponent className="size-4" />
                      )}

                      {/* Pulse effect on current step */}
                      {isCurrent && (
                        <span className="absolute -inset-1 rounded-full animate-ping bg-amber-400/40 pointer-events-none" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 sm:flex-initial">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isCurrent
                            ? "text-ds-primary font-extrabold"
                            : isPassed
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-ds-text-soft"
                        }`}
                      >
                        {isAr ? step.labelAr : step.labelEn}
                      </p>
                      <p className="text-[11px] text-ds-text-soft mt-0.5 line-clamp-2">
                        {isAr ? step.descAr : step.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shipment Delivery Information Footer */}
      <div className="rounded-2xl border border-ds-border-subtle bg-ds-plain p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-ds-primary/10 text-ds-primary flex items-center justify-center shrink-0">
            <Truck className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-ds-text-plain block">
              {isAr ? "الشحن عبر: مندوب ميري فاست دليفري" : "Carrier: MIRÉ Express Delivery"}
            </span>
            <span className="text-ds-text-soft block mt-0.5">
              {shippingGovernorate && shippingCity
                ? `${shippingGovernorate}، ${shippingCity}`
                : isAr
                ? "التوصيل لجميع محافظات مصر"
                : "Deliveries across all Egypt governorates"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-ds-text-plain block">
              {estimatedDelivery || (isAr ? "خلال 2 - 4 أيام عمل" : "Within 2 - 4 business days")}
            </span>
            <span className="text-ds-text-soft block mt-0.5">
              {formattedDate ? `${isAr ? "تاريخ الطلب: " : "Placed: "} ${formattedDate}` : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
