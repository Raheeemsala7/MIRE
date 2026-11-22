import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { CheckoutFlow } from "@/src/features/checkout";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "إتمام الطلب | ميري" : "Checkout | MIRÉ",
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 border-b border-ds-border-muted pb-6 mb-8">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
          <CreditCard className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-brand-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {isAr ? "إتمام الشراء" : "Checkout"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ds-text-muted">
            {isAr
              ? "أدخلي تفاصيل الشحن والتوصيل وحددي موقعكِ بدقة على الخريطة"
              : "Secure shipping, map location & payment details"}
          </p>
        </div>
      </div>

      <CheckoutFlow />
    </main>
  );
}
