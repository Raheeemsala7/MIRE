import type { Metadata } from "next";
import { CreditCard, ShieldCheck } from "lucide-react";

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
    <main className="mx-auto min-h-[60vh] max-w-4xl px-6 py-16 sm:px-10">
      <div className="flex items-center gap-3 border-b border-ds-border-muted pb-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
          <CreditCard className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {isAr ? "إتمام الشراء" : "Checkout"}
          </h1>
          <p className="mt-1 text-sm text-ds-text-muted">
            {isAr ? "أدخلي تفاصيل الشحن والدفع بأمان" : "Secure shipping and payment details"}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8">
            <h2 className="font-serif text-xl text-ds-text-plain">
              {isAr ? "عنوان التوصيل" : "Shipping Address"}
            </h2>
            <p className="mt-1 text-xs text-ds-text-muted">
              {isAr ? "التوصيل متاح لكافة محافظات مصر" : "Delivery available across Egypt"}
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder={isAr ? "الاسم بالكامل" : "Full name"}
                className="h-12 w-full rounded-xl border border-ds-border-muted bg-ds-plain px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
              />
              <input
                type="tel"
                placeholder={isAr ? "رقم الهاتف (+20...)" : "Phone number"}
                dir="ltr"
                className="h-12 w-full rounded-xl border border-ds-border-muted bg-ds-plain px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
              />
              <input
                type="text"
                placeholder={isAr ? "العنوان بالتفصيل" : "Street address, building, apartment"}
                className="h-12 w-full rounded-xl border border-ds-border-muted bg-ds-plain px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8">
            <h2 className="font-serif text-xl text-ds-text-plain">
              {isAr ? "طريقة الدفع" : "Payment Method"}
            </h2>
            <div className="mt-4 space-y-2 text-sm text-ds-text-muted">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ds-border-muted p-4 hover:border-ds-primary">
                <input type="radio" name="payment" defaultChecked className="size-4 accent-ds-primary" />
                <span>{isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ds-border-muted p-4 hover:border-ds-primary">
                <input type="radio" name="payment" className="size-4 accent-ds-primary" />
                <span>{isAr ? "بطاقة بنكية / باي موب (Paymob)" : "Credit / Debit Card (Paymob)"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8">
          <h2 className="font-serif text-xl text-ds-text-plain">
            {isAr ? "ملخص الطلب" : "Order Summary"}
          </h2>
          <div className="mt-6 space-y-3 text-sm border-b border-ds-border-muted pb-6">
            <div className="flex justify-between text-ds-text-muted">
              <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>—</span>
            </div>
            <div className="flex justify-between text-ds-text-muted">
              <span>{isAr ? "الشحن" : "Shipping"}</span>
              <span>{isAr ? "مجاني" : "Free"}</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-6 h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-ds-primary-saturated"
          >
            {isAr ? "تأكيد الطلب" : "Place Order"}
          </button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ds-text-soft">
            <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
            <span>{isAr ? "عملية دفع آمنة 100%" : "100% Secure Checkout"}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
