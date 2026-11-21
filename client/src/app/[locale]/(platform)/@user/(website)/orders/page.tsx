import { Suspense } from "react";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { Package } from "lucide-react";
import { OrdersView } from "@/src/features/order";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

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
  const user = await currentUser();

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 border-b border-ds-border-muted pb-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
          <Package className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-brand-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {isAr ? "طلباتي السابقة" : "Order History"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ds-text-muted">
            {user
              ? isAr
                ? `مرحباً ${user.name}، تابعي حالة وتفاصيل شحن طلباتكِ هنا`
                : `Welcome back ${user.name}, track and manage your previous orders`
              : isAr
              ? "تابعي حالة وتفاصيل طلباتكِ وموقع التوصيل المحدد"
              : "Track your orders, delivery status and pinned addresses"}
          </p>
        </div>
      </div>

      <OrdersView userName={user?.name} />
    </main>
  );
}

export default function OrdersPage(props: Parameters<typeof OrdersPageContent>[0]) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <OrdersPageContent {...props} />
    </Suspense>
  );
}
