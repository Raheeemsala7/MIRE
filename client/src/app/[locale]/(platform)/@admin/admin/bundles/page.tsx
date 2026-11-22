import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  BundlesDashboard,
  BundlesSkeleton,
  type BundlesPaginatedResponse,
  type BundleOverviewStats,
  type BundleFilters,
} from "@/features/bundles";
import {
  getAdminBundles,
  getAdminBundleOverviewStats,
} from "@/features/bundles/apis/bundles.api";

interface AdminBundlesPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminBundlesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة الباقات والعروض الترويجية | إدارة ميري"
      : "Bundles & Promotional Offers | MIRÉ Admin",
    description: isAr
      ? "إدارة الباقات والخصومات والعروض الترويجية وعروض BOGO"
      : "Manage product bundles, discounts, promotional offers, and BOGO campaigns.",
  };
}

async function AdminBundlesPageContent({
  params,
  searchParams,
}: AdminBundlesPageProps) {
  const { locale } = await params;
  const user = await requirePermission(PERMISSIONS.BUNDLES_VIEW, locale);

  const sp = searchParams ? await searchParams : {};
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;
  const limit = typeof sp.limit === "string" ? Number(sp.limit) : 20;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const type = typeof sp.type === "string" ? (sp.type as BundleFilters["type"]) : undefined;
  const status = typeof sp.status === "string" ? (sp.status as BundleFilters["status"]) : undefined;
  const sortBy = typeof sp.sortBy === "string" ? sp.sortBy : undefined;

  const currentFilters: BundleFilters = {
    page,
    limit,
    search,
    type,
    status,
    sortBy,
  };

  let initialData: BundlesPaginatedResponse | undefined;
  let stats: BundleOverviewStats = {
    totalBundles: 0,
    activeBundles: 0,
    scheduledBundles: 0,
    expiredBundles: 0,
    inactiveBundles: 0,
  };

  try {
    const [bundlesRes, statsRes] = await Promise.all([
      getAdminBundles(currentFilters),
      getAdminBundleOverviewStats(),
    ]);

    if (bundlesRes?.success && Array.isArray(bundlesRes.data)) {
      initialData = bundlesRes;
    }
    if (statsRes) {
      stats = statsRes;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    // Graceful fallback: client React Query will fetch
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<BundlesSkeleton />}>
        <BundlesDashboard
          initialData={initialData}
          initialFilters={currentFilters}
          stats={stats}
          currentUser={user}
          locale={locale}
        />
      </Suspense>
    </main>
  );
}

export default function AdminBundlesPage(props: AdminBundlesPageProps) {
  return (
    <Suspense fallback={<AdminBundlesLoadingWrapper />}>
      <AdminBundlesPageContent {...props} />
    </Suspense>
  );
}

function AdminBundlesLoadingWrapper() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BundlesSkeleton />
    </main>
  );
}
