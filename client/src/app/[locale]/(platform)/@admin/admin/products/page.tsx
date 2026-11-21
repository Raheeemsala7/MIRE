import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  ProductsDashboard,
  ProductsSkeleton,
  type ProductsPaginatedResponse,
  type ProductOverviewStats,
  type CategoryItem,
  type ProductFilters,
} from "@/features/products";
import {
  getAdminProducts,
  getAdminProductOverviewStats,
  getCategories,
} from "@/features/products/server/queries";

interface AdminProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة المنتجات والمخزون | إدارة ميري"
      : "Products & Inventory Management | MIRÉ Admin",
    description: isAr
      ? "إدارة كتالوج المنتجات، والخيارات، وتفاصيل الأسعار، والمخزون"
      : "Manage catalog products, variants, pricing details, and inventory.",
  };
}

async function AdminProductsPageContent({
  params,
  searchParams,
}: AdminProductsPageProps) {
  const { locale } = await params;
  const user = await requirePermission(PERMISSIONS.PRODUCTS_VIEW, locale);

  const sp = searchParams ? await searchParams : {};
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;
  const limit = typeof sp.limit === "string" ? Number(sp.limit) : 20;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const status = typeof sp.status === "string" ? (sp.status as ProductFilters["status"]) : undefined;
  const sortBy = typeof sp.sortBy === "string" ? sp.sortBy : undefined;

  const currentFilters: ProductFilters = {
    page,
    limit,
    search,
    category,
    status,
    sortBy,
  };

  let initialData: ProductsPaginatedResponse | undefined;
  let stats: ProductOverviewStats = {
    totalProducts: 0,
    activeProducts: 0,
    archivedProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  };
  let categories: CategoryItem[] = [];

  try {
    const [productsRes, statsRes, categoriesRes] = await Promise.all([
      getAdminProducts(currentFilters),
      getAdminProductOverviewStats(),
      getCategories(),
    ]);

    if (productsRes?.success && Array.isArray(productsRes.data)) {
      initialData = productsRes;
    }
    if (statsRes) {
      stats = statsRes;
    }
    categories = categoriesRes;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    // Graceful fallback: client React Query will fetch
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsDashboard
          initialData={initialData}
          initialFilters={currentFilters}
          stats={stats}
          categories={categories}
          currentUser={user}
          locale={locale}
        />
      </Suspense>
    </main>
  );
}

export default function AdminProductsPage(props: AdminProductsPageProps) {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <AdminProductsPageContent {...props} />
    </Suspense>
  );
}
