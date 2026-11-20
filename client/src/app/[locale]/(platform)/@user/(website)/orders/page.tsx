import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";
import { Package, ArrowRight } from "lucide-react";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "طلباتي | ميري" : "My Orders | MIRÉ",
  };
}

async function OrdersPageContent({ params }: OrdersPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const user = await requireRole(["CUSTOMER", "ADMIN", "SUPER_ADMIN"], locale);

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-6 py-16 sm:px-10">
      <div className="flex items-center gap-3 border-b border-ds-border-muted pb-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
          <Package className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {isAr ? "طلباتي السابقة" : "Order History"}
          </h1>
          <p className="mt-1 text-sm text-ds-text-muted">
            {isAr
              ? `مرحبًا ${user.name}، تابعي حالة وتفاصيل طلباتكِ هنا`
              : `Welcome back ${user.name}, track and manage your previous orders`}
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ds-border-muted bg-ds-elevated/40 p-12 text-center">
        <Package className="size-12 text-ds-text-soft" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl text-ds-text-plain">
          {isAr ? "لا توجد طلبات سابقة بعد" : "No orders yet"}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-ds-text-muted">
          {isAr
            ? "عند إتمام أي طلب، ستظهر تفاصيل وحالة الشحن هنا فورًا."
            : "When you place an order, its details and shipment tracking will appear here."}
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ds-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ds-primary-saturated hover:shadow-md"
        >
          <span>{isAr ? "تسوق الآن" : "Start Shopping"}</span>
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}

export default function OrdersPage(props: Parameters<typeof OrdersPageContent>[0]) {
  return <Suspense fallback={<AuthSkeleton />}><OrdersPageContent {...props} /></Suspense>;
}
