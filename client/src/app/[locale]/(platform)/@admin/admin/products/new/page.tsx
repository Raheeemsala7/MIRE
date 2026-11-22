import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { ProductForm, type CategoryItem } from "@/features/products";
import { getCategories } from "@/features/products/apis/products.api";
import AdminNewProductLoading from "./loading";

interface AdminNewProductPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminNewProductPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إضافة منتج جديد | إدارة ميري"
      : "Add New Product | MIRÉ Admin",
    description: isAr
      ? "إضافة منتج جديد إلى الكتالوج مع الخيارات والأسعار والصور"
      : "Add a new product to the catalog with variants, pricing, and imagery.",
  };
}

async function AdminNewProductContent({ params }: AdminNewProductPageProps) {
  const { locale } = await params;
  await requirePermission(PERMISSIONS.PRODUCTS_CREATE, locale);

  let categories: CategoryItem[] = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductForm categories={categories} />
    </main>
  );
}

export default function AdminNewProductPage(props: AdminNewProductPageProps) {
  return (
    <Suspense fallback={<AdminNewProductLoading />}>
      <AdminNewProductContent {...props} />
    </Suspense>
  );
}
