import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  ReturnsDashboard,
  ReturnsDashboardSkeleton,
  type ReturnsPaginatedResponse,
  type ReturnsOverviewStats,
} from "@/features/returns";

interface AdminReturnsPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminReturnsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة المرتجعات | لوحة تحكم ميري"
      : "Returns Management | MIRÉ Admin",
    description: isAr
      ? "متابعة طلبات الإرجاع، اتصالات العملاء، الفحص الفني، وإعادة إدراج المخزون"
      : "Manage return requests, customer follow-ups, inspections, and inventory restocking.",
  };
}

async function getInitialReturnsData(
  locale: string,
  searchParams?: { [key: string]: string | string[] | undefined }
): Promise<ReturnsPaginatedResponse | undefined> {
  const query = new URLSearchParams();
  const page = typeof searchParams?.page === "string" ? searchParams.page : "1";
  const limit = typeof searchParams?.limit === "string" ? searchParams.limit : "20";
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const search = typeof searchParams?.search === "string" ? searchParams.search.trim() : "";
  const sort = typeof searchParams?.sort === "string" ? searchParams.sort : "-createdAt";

  query.set("page", page);
  query.set("limit", limit);
  if (status && status !== "ALL") query.set("status", status);
  if (search) query.set("search", search);
  query.set("sort", sort);

  try {
    const response = await serverApiGet<ReturnsPaginatedResponse>(
      `/returns?${query.toString()}` as `/${string}`
    );
    if (response?.success && Array.isArray(response.data)) {
      return response;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    // Graceful fallback: client React Query will fetch on hydration
  }
  return undefined;
}

async function getInitialReturnsStats(): Promise<
  { success: boolean; data: ReturnsOverviewStats } | undefined
> {
  try {
    const [
      totalRes,
      pendingRes,
      approvedRes,
      pickupRes,
      pickedUpRes,
      receivedRes,
      inspectedRes,
      refundedRes,
      rejectedRes,
    ] = await Promise.all([
      serverApiGet<ReturnsPaginatedResponse>("/returns?limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=RETURN_REQUESTED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=RETURN_APPROVED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=PICKUP_SCHEDULED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=PICKED_UP&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=RECEIVED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=INSPECTED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=REFUNDED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=REJECTED&limit=1"),
    ]);

    return {
      success: true,
      data: {
        total: totalRes?.total ?? 0,
        pending: pendingRes?.total ?? 0,
        approved: approvedRes?.total ?? 0,
        inTransit:
          (pickupRes?.total ?? 0) +
          (pickedUpRes?.total ?? 0) +
          (receivedRes?.total ?? 0),
        inspected: inspectedRes?.total ?? 0,
        refunded: refundedRes?.total ?? 0,
        rejected: rejectedRes?.total ?? 0,
      },
    };
  } catch {
    return undefined;
  }
}

async function AdminReturnsPageContent({
  params,
  searchParams,
}: AdminReturnsPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requirePermission(PERMISSIONS.RETURNS_VIEW, locale);
  const [initialData, initialStats] = await Promise.all([
    getInitialReturnsData(locale, resolvedSearchParams),
    getInitialReturnsStats(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<ReturnsDashboardSkeleton />}>
        <ReturnsDashboard
          initialData={initialData}
          initialStats={initialStats}
          locale={locale}
          currentUser={user}
        />
      </Suspense>
    </main>
  );
}

export default function AdminReturnsPage(
  props: Parameters<typeof AdminReturnsPageContent>[0]
) {
  return (
    <Suspense fallback={<ReturnsDashboardSkeleton />}>
      <AdminReturnsPageContent {...props} />
    </Suspense>
  );
}
