import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  OrderDetailsView,
  type OrderDoc,
} from "@/features/admin/orders";

interface AdminOrderDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailsPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? `تفاصيل الطلب #${id} | لوحة تحكم ميري`
      : `Order #${id} Details | MIRÉ Admin`,
    description: isAr
      ? "استعراض تفاصيل الطلب وتحديث حالة التوصيل"
      : "View order details and manage fulfillment lifecycle",
  };
}

async function getOrderDetails(id: string, locale: string): Promise<OrderDoc> {
  try {
    const response = await serverApiGet<{ success: boolean; data: OrderDoc }>(
      `/orders/${encodeURIComponent(id)}` as `/${string}`
    );
    if (response?.success && response.data) {
      return response.data;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    console.error("getOrderDetails backend error:", error);
  }

  notFound();
}

export default async function AdminOrderDetailsPage(
  props: AdminOrderDetailsPageProps
) {
  const { locale, id } = await props.params;

  await requirePermission(PERMISSIONS.ORDERS_VIEW, locale);

  const order = await getOrderDetails(id, locale);

  return (
    <Suspense fallback={<OrderDetailsLoadingSkeleton />}>
      <OrderDetailsView order={order} />
    </Suspense>
  );
}

function OrderDetailsLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-muted/60" />
      <div className="h-44 rounded-2xl bg-muted/40" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-96 rounded-2xl bg-muted/40" />
        <div className="lg:col-span-7 h-96 rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}
