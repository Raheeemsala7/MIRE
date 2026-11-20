"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Truck,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { ReturnDoc } from "../../types/return.types";
import { ReturnStatusBadge } from "../shared/return-status-badge";
import { formatCurrency, REASON_CONFIG } from "../../utils/return.util";

interface ReturnRequestSuccessProps {
  returnDoc: ReturnDoc;
  locale?: string;
}

export function ReturnRequestSuccess({
  returnDoc,
  locale = "en",
}: ReturnRequestSuccessProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const reasonMeta = REASON_CONFIG[returnDoc.reason];
  const reasonLabel = isAr ? reasonMeta?.labelAr || returnDoc.reason : reasonMeta?.labelEn || returnDoc.reason;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success Hero */}
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
          <CheckCircle className="size-8" />
        </div>
        <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("customer-returns-success-title") || "Return Request Submitted"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {t("customer-returns-success-desc") ||
            "We have received your return request. Our operations team will review it and dispatch a courier for pickup."}
        </p>

        {/* Return Number Badge */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-4 py-1.5 shadow-2xs">
          <span className="text-xs text-muted-foreground">
            {isAr ? "رقم المرتجع:" : "Return Reference:"}
          </span>
          <span className="font-mono text-sm font-bold text-primary" dir="ltr">
            {returnDoc.returnNumber}
          </span>
          <ReturnStatusBadge status={returnDoc.status} locale={locale} />
        </div>
      </div>

      {/* Return Details Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileCheck2 className="size-4 text-primary" />
            <span>{isAr ? "ملخص طلب الإرجاع" : "Return Request Summary"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {/* Items List */}
          <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
            {returnDoc.items.map((item) => (
              <div key={item._id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-foreground">
                    {typeof item.product === "object" ? item.product.name : "Item"}
                  </p>
                  <p className="font-mono text-muted-foreground" dir="ltr">
                    {item.color} / {item.size} · Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-foreground" dir="ltr">
                  {formatCurrency(item.unitPrice * item.quantity, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <span className="text-muted-foreground">{isAr ? "السبب:" : "Reason:"}</span>
              <p className="font-semibold text-foreground mt-0.5">{reasonLabel}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <span className="text-muted-foreground">{isAr ? "المبلغ المسترد التقديري:" : "Estimated Refund:"}</span>
              <p className="font-semibold text-foreground mt-0.5" dir="ltr">
                {formatCurrency(returnDoc.refundAmount, locale)}
              </p>
            </div>
          </div>

          {/* Courier Instructions */}
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
            <Truck className="size-5 shrink-0 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                {isAr ? "الخطوات القادمة لترتيب الاستلام:" : "Next Steps for Courier Pickup:"}
              </p>
              <p className="text-muted-foreground">
                {isAr
                  ? "سيتواصل معكِ مندوب الشحن هاتفياً خلال 24-48 ساعة عمل لاستلام الشحنة. يرجى تجهيز القطع في غلافها الأصلي مع الحفاظ على جميع الملصقات."
                  : "Our courier partner will contact you within 24-48 business hours to collect the parcel. Please ensure items are in their original packaging with tags intact."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/orders"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-background px-6 py-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted"
        >
          <span>{isAr ? "العودة لطلباتي" : "Back to My Orders"}</span>
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <span>{isAr ? "متابعة التسوق" : "Continue Shopping"}</span>
          <ArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
