import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { getNextAuthToken, clearAuthCookies } from "@/shared/lib/utils/auth.utils";
import { normalizeLocale } from "@/lib/auth/permissions";
import { hasRole } from "@/lib/auth/roles";
import { CustomerOrderDetailView } from "@/src/features/order";
import { getCustomerOrderByIdApi } from "@/src/features/order/apis/order.api";
import { isOrderOwnedByUser } from "@/features/order/utils/order-ownership.util";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

interface AccountOrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AccountOrderDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? `تفاصيل الطلب #${id} | ميري` : `Order #${id} Details | MIRÉ`,
    description: isAr
      ? "متابعة مسار وتفاصيل شحنة الطلب"
      : "Track personal customer order details and shipment status",
  };
}

async function AccountOrderDetailPageContent({
  params,
}: AccountOrderDetailPageProps) {
  const { locale, id } = await params;
  const language = normalizeLocale(locale);

  // Authenticated server-side session verification
  const session = await getServerSession();
  const token = await getNextAuthToken();

  if (!session?.user || !token?.token) {
    await clearAuthCookies();
    redirect(`/${language}/auth/login?callbackUrl=/${language}/account/orders/${id}`);
  }

  if (!hasRole(session.user.role, ["CUSTOMER", "ADMIN", "SUPER_ADMIN"])) {
    redirect(`/${language}/403`);
  }

  // Fetch single order strictly scoped to authenticated user
  const order = await getCustomerOrderByIdApi(id);

  if (!order || !isOrderOwnedByUser(order, session.user.id, session.user.role)) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-[65vh] max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <CustomerOrderDetailView order={order} backHref="/account/orders" />
    </main>
  );
}

export default function AccountOrderDetailPage(
  props: Parameters<typeof AccountOrderDetailPageContent>[0]
) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AccountOrderDetailPageContent {...props} />
    </Suspense>
  );
}
