import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import { ProductForm, type CategoryItem } from "@/features/products";
import {
  getAdminProductById,
  getCategories,
} from "@/features/products/server/queries";
import AdminEditProductLoading from "./loading";

interface AdminEditProductPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminEditProductPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    const res = await getAdminProductById(id);
    if (res?.data) {
      return {
        title: isAr
          ? `تعديل ${res.data.name} | إدارة ميري`
          : `Edit ${res.data.name} | MIRÉ Admin`,
        description: res.data.description?.slice(0, 160),
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr ? "تعديل المنتج | إدارة ميري" : "Edit Product | MIRÉ Admin",
  };
}

async function AdminEditProductContent({
  params,
}: AdminEditProductPageProps) {
  const { locale, id } = await params;
  await requirePermission(PERMISSIONS.PRODUCTS_UPDATE, locale);

  let product;
  let categories: CategoryItem[] = [];

  try {
    const [productRes, categoriesRes] = await Promise.all([
      getAdminProductById(id),
      getCategories(),
    ]);

    if (!productRes?.data) {
      notFound();
    }

    product = productRes.data;
    categories = categoriesRes;
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 404) notFound();
      if (error.status === 403) redirect(`/${locale}/403`);
    }
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductForm
        categories={categories}
        initialProduct={product}
        isEditMode
      />
    </main>
  );
}

export default function AdminEditProductPage(props: AdminEditProductPageProps) {
  return (
    <Suspense fallback={<AdminEditProductLoading />}>
      <AdminEditProductContent {...props} />
    </Suspense>
  );
}
