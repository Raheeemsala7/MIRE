import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  OrdersTable,
  type OrderDoc,
  type OrdersPaginatedResponse,
} from "@/features/admin/orders";

interface AdminOrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminOrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة الطلبات | لوحة تحكم ميري"
      : "Orders Management | MIRÉ Admin",
    description: isAr
      ? "متابعة وإدارة طلبات العملاء وتحديث حالات الشحن والتجهيز"
      : "Manage orders, update shipment and fulfillment statuses.",
  };
}

async function getInitialOrdersData(
  locale: string,
  searchParams?: { [key: string]: string | string[] | undefined }
): Promise<{ orders: OrderDoc[]; total: number }> {
  const query = new URLSearchParams();
  const page = typeof searchParams?.page === "string" ? searchParams.page : "1";
  const limit = typeof searchParams?.limit === "string" ? searchParams.limit : "20";
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const search = typeof searchParams?.search === "string" ? searchParams.search.trim() : "";

  query.set("page", page);
  query.set("limit", limit);
  if (status && status !== "ALL") query.set("status", status);
  if (search) query.set("search", search);

  try {
    const response = await serverApiGet<OrdersPaginatedResponse>(
      `/orders?${query.toString()}` as `/${string}`
    );
    if (response?.success && Array.isArray(response.data)) {
      return { orders: response.data, total: response.total ?? response.data.length };
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    console.error("getInitialOrdersData backend error:", error);
  }

  return { orders: [], total: 0 };
}

export default async function AdminOrdersPage(props: AdminOrdersPageProps) {
  const { locale } = await props.params;
  const rawSearchParams = props.searchParams ? await props.searchParams : undefined;

  await requirePermission(PERMISSIONS.ORDERS_VIEW, locale);

  const { orders, total } = await getInitialOrdersData(locale, rawSearchParams);

  return (
    <Suspense fallback={<OrdersLoadingSkeleton />}>
      <OrdersTable initialOrders={orders} totalCount={total} />
    </Suspense>
  );
}

function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-muted/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-muted/40" />
    </div>
  );
}
