import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  CustomerDetails,
  CustomerDetailsSkeleton,
  type CustomerDetailsResponse,
  type CustomerDetailsData,
} from "@/features/customers";

interface CustomerDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: CustomerDetailsPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_VIEW, locale);
    const res = await serverApiGet<CustomerDetailsResponse>(
      `/customers/${encodeURIComponent(id)}` as `/${string}`
    );
    if (res?.data?.customer) {
      return {
        title: isAr
          ? `${res.data.customer.fullName} | إدارة العملاء | ميري`
          : `${res.data.customer.fullName} | Customer Profile | MIRÉ Admin`,
        description: res.data.customer.email || res.data.customer.phone,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr
      ? "الملف التعريفي للعميل | إدارة ميري"
      : "Customer Profile | MIRÉ Admin",
  };
}

async function getCustomerDetails(
  id: string,
  locale: string
): Promise<CustomerDetailsData> {
  try {
    const response = await serverApiGet<CustomerDetailsResponse>(
      `/customers/${encodeURIComponent(id)}` as `/${string}`
    );
    if (response?.success && response.data?.customer) {
      return response.data;
    }
    notFound();
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) {
        redirect(`/${locale}/403`);
      }
      if (error.status === 404 || error.status === 400) {
        notFound();
      }
    }
    throw error;
  }
}

async function CustomerDetailsPageContent({
  params,
}: CustomerDetailsPageProps) {
  const { locale, id } = await params;
  const user = await requirePermission(PERMISSIONS.CUSTOMERS_VIEW, locale);
  const data = await getCustomerDetails(id, locale);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<CustomerDetailsSkeleton />}>
        <CustomerDetails
          customer={data.customer}
          recentOrders={data.recentOrders || []}
          currentUser={user}
          locale={locale}
        />
      </Suspense>
    </main>
  );
}

export default function CustomerDetailsPage(
  props: Parameters<typeof CustomerDetailsPageContent>[0]
) {
  return (
    <Suspense fallback={<CustomerDetailsSkeleton />}>
      <CustomerDetailsPageContent {...props} />
    </Suspense>
  );
}
