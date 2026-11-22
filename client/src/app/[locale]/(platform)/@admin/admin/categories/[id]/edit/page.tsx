import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  CategoryForm,
  CategoriesSkeleton,
  getAdminCategories,
  getAdminCategoryById,
  type CategoryItem,
} from "@/features/categories";

interface EditCategoryPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: EditCategoryPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const category = await getAdminCategoryById(id);

  const titlePrefix = category ? category.name : "Category";
  return {
    title: isAr
      ? `تعديل ${titlePrefix} | إدارة ميري`
      : `Edit ${titlePrefix} | MIRÉ Admin`,
    description: isAr
      ? "تحديث بيانات القسم، الهيكل الهرمي، وحالة الظهور"
      : "Update category details, parent hierarchy, and storefront visibility.",
  };
}

async function EditCategoryPageContent({ params }: EditCategoryPageProps) {
  const { locale, id } = await params;
  await requirePermission(PERMISSIONS.CATEGORIES_UPDATE, locale);

  const allCategories = await getAdminCategories({ includeInactive: true }).catch(
    () => [] as CategoryItem[]
  );
  const category = await getAdminCategoryById(id, allCategories);

  if (!category) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CategoryForm
        initialCategory={category}
        categories={allCategories}
        locale={locale}
      />
    </main>
  );
}

export default function EditCategoryPage(props: EditCategoryPageProps) {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <EditCategoryPageContent {...props} />
    </Suspense>
  );
}
