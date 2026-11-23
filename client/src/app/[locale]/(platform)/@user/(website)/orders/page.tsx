import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { getNextAuthToken, clearAuthCookies } from "@/shared/lib/utils/auth.utils";
import { normalizeLocale } from "@/lib/auth/permissions";
import { hasRole } from "@/lib/auth/roles";
import { Truck } from "lucide-react";
import { OrdersView } from "@/src/features/order";
import { getOrdersApi } from "@/src/features/order/apis/order.api";
import { isOrderOwnedByUser } from "@/features/order/utils/order-ownership.util";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "طلباتي ومتابعة الشحن | ميري" : "My Orders & Tracking | MIRÉ",
    description: isAr
      ? "تابعي تفاصيل وحالة طلباتكِ الحالية والسابقة في متجر ميري"
      : "Track your active and completed orders with MIRÉ",
  };
}

async function OrdersPageContent({ params }: OrdersPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const language = normalizeLocale(locale);

  // Authenticated server-side session verification
  const session = await getServerSession();
  const token = await getNextAuthToken();

  if (!session?.user || !token?.token) {
    await clearAuthCookies();
    redirect(`/${language}/auth/login?callbackUrl=/${language}/orders`);
  }

  if (!hasRole(session.user.role, ["CUSTOMER", "ADMIN", "SUPER_ADMIN"])) {
    redirect(`/${language}/403`);
  }

  const user = session.user;

  // Fetch only authenticated customer's own orders on the server
  const rawOrders = await getOrdersApi({ userId: user.id });
  const initialOrders = rawOrders.filter((order) =>
    isOrderOwnedByUser(order, user.id, user.role)
  );

  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Title & Subtitle */}
      <div className="flex items-center gap-3.5 border-b border-ds-border-muted/60 pb-6 mb-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-ds-primary/10 text-ds-primary shadow-xs border border-ds-primary/20">
          <Truck className="size-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl font-medium">
            {isAr ? "متابعة طلباتي" : "My Orders"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ds-text-muted">
            {isAr
              ? `أهلاً بكِ ${user.name}، تابعي مسار وتفاصيل طلباتكِ الخاصة وتحديثات التوصيل خطوة بخطوة`
              : `Welcome ${user.name}, track your personal orders and live delivery progress`}
          </p>
        </div>
      </div>

      <OrdersView userName={user.name} initialOrders={initialOrders} />
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
