import { Suspense } from "react";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { Package, Truck } from "lucide-react";
import { OrdersView } from "@/src/features/order";
import { getCustomerOrders } from "@/src/features/order/server/queries";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "متابعة طلباتي الحالية | ميري" : "Track My Orders | MIRÉ",
  };
}

async function OrdersPageContent({ params }: OrdersPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const user = await currentUser();

  // Fetch real customer orders on the server (Server Component)
  const initialOrders = await getCustomerOrders();

  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Title & Subtitle */}
      <div className="flex items-center gap-3.5 border-b border-ds-border-muted/60 pb-6 mb-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-ds-primary/10 text-ds-primary shadow-xs border border-ds-primary/20">
          <Truck className="size-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl font-medium">
            {isAr ? "متابعة طلباتي الحالية" : "Track My Orders"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ds-text-muted">
            {user
              ? isAr
                ? `أهلاً بكِ ${user.name}، تابعي مسار وتفاصيل طلباتكِ الحالية والمكتملة خطوة بخطوة`
                : `Welcome ${user.name}, track your current orders and delivery progress step-by-step`
              : isAr
              ? "تابعي حالة طلباتكِ الجارية وموقع التوصيل المحدد أو ابحثي برقم الشحنة"
              : "Track active shipments, pinned delivery location, or search by order number"}
          </p>
        </div>
      </div>

      <OrdersView userName={user?.name} initialOrders={initialOrders} />
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
