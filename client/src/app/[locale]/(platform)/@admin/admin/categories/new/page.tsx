import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  CategoryForm,
  CategoriesSkeleton,
  getAdminCategories,
  type CategoryItem,
} from "@/features/categories";

interface NewCategoryPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: NewCategoryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إنشاء قسم جديد | إدارة ميري"
      : "Create Category | MIRÉ Admin",
    description: isAr
      ? "إضافة قسم جديد أو قسم فرعي إلى الكتالوج"
      : "Create a new catalog category or nested subcategory.",
  };
}

async function NewCategoryPageContent({
  params,
  searchParams,
}: NewCategoryPageProps) {
  const { locale } = await params;
  await requirePermission(PERMISSIONS.CATEGORIES_CREATE, locale);

  const sp = searchParams ? await searchParams : {};
  const defaultParentId = typeof sp.parent === "string" ? sp.parent : undefined;

  let categories: CategoryItem[] = [];
  try {
    categories = await getAdminCategories({ includeInactive: true });
  } catch {
    // Non-blocking fallback
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CategoryForm
        categories={categories}
        defaultParentId={defaultParentId}
        locale={locale}
      />
    </main>
  );
}

export default function NewCategoryPage(props: NewCategoryPageProps) {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <NewCategoryPageContent {...props} />
    </Suspense>
  );
}
