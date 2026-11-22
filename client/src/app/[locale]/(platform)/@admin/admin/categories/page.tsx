import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import { can } from "@/lib/permissions/can";
import {
  CategoriesDashboard,
  CategoriesSkeleton,
  getAdminCategories,
  calculateCategoryStats,
  buildCategoryTree,
  type CategoryItem,
  type CategoryOverviewStats,
  type CategoryTreeNode,
} from "@/features/categories";

interface AdminCategoriesPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminCategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة الأقسام والتصنيفات | إدارة ميري"
      : "Category Management | MIRÉ Admin",
    description: isAr
      ? "تنظيم وإدارة تصنيفات منتجات متجرك والأقسام الفرعية"
      : "Organize and manage catalog categories and hierarchical subcategories.",
  };
}

async function AdminCategoriesPageContent({
  params,
}: AdminCategoriesPageProps) {
  const { locale } = await params;
  const user = await requirePermission(PERMISSIONS.CATEGORIES_VIEW, locale);

  let categories: CategoryItem[] = [];
  let initialTree: CategoryTreeNode[] = [];
  let stats: CategoryOverviewStats = {
    totalCategories: 0,
    parentCategories: 0,
    subcategories: 0,
    activeCategories: 0,
  };

  try {
    categories = await getAdminCategories({ includeInactive: true });
    initialTree = buildCategoryTree(categories);
    stats = calculateCategoryStats(categories);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
  }

  const canWrite = can(user.role, PERMISSIONS.CATEGORIES_CREATE, user.permissions);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesDashboard
          initialCategories={categories}
          initialTree={initialTree}
          stats={stats}
          canWrite={canWrite}
          locale={locale}
        />
      </Suspense>
    </main>
  );
}

export default function AdminCategoriesPage(props: AdminCategoriesPageProps) {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <AdminCategoriesPageContent {...props} />
    </Suspense>
  );
}
