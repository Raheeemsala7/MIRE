import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  CustomersDashboard,
  CustomersSkeleton,
  type CustomersPaginatedResponse,
} from "@/features/customers";

interface AdminCustomersPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminCustomersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة العملاء | لوحة تحكم ميري"
      : "Customers Management | MIRÉ Admin",
    description: isAr
      ? "إدارة بيانات العملاء، تنظيم الحسابات، ومتابعة سجل الطلبات"
      : "Manage customer profiles, organize tags, and review purchase history.",
  };
}

async function getInitialCustomersData(
  locale: string,
  searchParams?: { [key: string]: string | string[] | undefined }
): Promise<CustomersPaginatedResponse | undefined> {
  const query = new URLSearchParams();
  const page = typeof searchParams?.page === "string" ? searchParams.page : "1";
  const limit = typeof searchParams?.limit === "string" ? searchParams.limit : "20";
  const search = typeof searchParams?.search === "string" ? searchParams.search.trim() : "";
  const sortBy = typeof searchParams?.sortBy === "string" ? searchParams.sortBy : "createdAt:desc";

  query.set("page", page);
  query.set("limit", limit);
  if (search) query.set("search", search);
  query.set("sortBy", sortBy);

  try {
    const response = await serverApiGet<CustomersPaginatedResponse>(
      `/customers?${query.toString()}` as `/${string}`
    );
    if (response?.success && Array.isArray(response.data)) {
      return response;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    // Graceful fallback: client React Query will fetch with fresh auth
  }
  return undefined;
}

async function AdminCustomersPageContent({
  params,
  searchParams,
}: AdminCustomersPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requirePermission(PERMISSIONS.CUSTOMERS_VIEW, locale);
  const initialData = await getInitialCustomersData(locale, resolvedSearchParams);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<CustomersSkeleton />}>
        <CustomersDashboard
          initialData={initialData}
          locale={locale}
          currentUser={user}
        />
      </Suspense>
    </main>
  );
}

export default function AdminCustomersPage(
  props: Parameters<typeof AdminCustomersPageContent>[0]
) {
  return (
    <Suspense fallback={<CustomersSkeleton />}>
      <AdminCustomersPageContent {...props} />
    </Suspense>
  );
}
