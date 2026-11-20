"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  RotateCcw,
  Package,
  ShieldCheck,
  Truck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface CustomerReturnsHubProps {
  locale?: string;
  userName?: string;
}

export function CustomerReturnsHub({
  locale = "en",
  userName = "",
}: CustomerReturnsHubProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const steps = [
    {
      icon: Package,
      titleEn: "1. Select Delivered Order",
      titleAr: "١. اختاري الطلب والقطع",
      descEn: "Choose any delivered order within the 14-day window and pick items to return.",
      descAr: "اختاري أي طلب مستلم خلال 14 يوماً وحددي القطع المراد إرجاعها والسبب.",
    },
    {
      icon: Truck,
      titleEn: "2. Courier Pickup",
      titleAr: "٢. استلام المندوب للشحنة",
      descEn: "Our courier partner will contact you within 24-48 hours to collect the parcel.",
      descAr: "سيتواصل معكِ مندوب الشحن خلال 24-48 ساعة عمل لاستلام الطرد في غلافه الأصلي.",
    },
    {
      icon: ShieldCheck,
      titleEn: "3. Inspection & Refund",
      titleAr: "٣. الفحص الفني ورد المبلغ",
      descEn: "Upon warehouse inspection and approval, your refund is processed swiftly.",
      descAr: "فور وصول الشحنة للمستودع وإتمام الفحص الفني، يتم رد المبلغ وفق طريقتكِ المفضلة.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-b from-primary/5 via-card to-card p-8 sm:p-10 text-center shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <RotateCcw className="size-7" />
        </div>
        <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("customer-returns-hub-title") || "Returns & Exchanges"}
        </h1>
        <p className="mx-auto mt-2.5 max-w-lg text-sm text-muted-foreground">
          {isAr
            ? `مرحباً ${userName || "عزيزتي"}، في ميري نحرص على رضاكِ التام. يمكنكِ طلب إرجاع المنتجات المستلمة بكل سهولة وبشروط مرنة.`
            : `Welcome ${userName || ""}, at MIRÉ we are committed to your complete satisfaction. Request a return for eligible delivered items smoothly.`}
        </p>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/account/returns/request"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            <span>{t("customer-returns-request-title") || "Request a Return Now"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
          <Link
            href="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-2xs hover:bg-muted"
          >
            <span>{isAr ? "عرض طلباتي السابقة" : "View My Orders"}</span>
          </Link>
        </div>
      </div>

      {/* How Returns Work Steps */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-foreground text-center sm:text-start">
          {isAr ? "كيف تعمل عملية الإرجاع في ميري؟" : "How does the return process work?"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="border-border/60 bg-card shadow-xs">
                <CardHeader className="p-5 pb-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-sm font-semibold mt-3">
                    {isAr ? step.titleAr : step.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isAr ? step.descAr : step.descEn}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Policy & Backend Transparency Notice */}
      <Card className="border-border/60 bg-muted/20 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            <span>{isAr ? "شروط وسياسة الإرجاع" : "Return Eligibility & Policy"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3 text-xs text-muted-foreground">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              {isAr
                ? "يجب تقديم طلب الإرجاع خلال 14 يوماً من تاريخ استلام الشحنة."
                : "Return requests must be initiated within 14 calendar days of delivery."}
            </li>
            <li>
              {isAr
                ? "يجب أن تكون القطع غير مستعملة، غير مغسولة، وبالغلاف والملصقات الأصلية (Tags Attached)."
                : "Items must be unworn, unwashed, and in their original packaging with tags intact."}
            </li>
            <li>
              {isAr
                ? "يتم تتبع طلبات الإرجاع عبر فريق عمليات ميري لضمان سرعة التنفيذ، وسيصلكِ إشعار ومكالمة هاتفية عند تنسيق الشحن والاستلام."
                : "All return records are processed securely through our operations team. You will receive SMS and phone updates throughout the pickup and refund stages."}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
