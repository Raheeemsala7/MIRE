import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import { BundleForm } from "@/features/bundles";
import { getAdminBundleById } from "@/features/bundles/server/queries";
import { getCategories, getAdminProducts } from "@/features/products/server/queries";
import type { CategoryItem, Product } from "@/features/products";
import AdminEditBundleLoading from "./loading";

interface AdminEditBundlePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminEditBundlePageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    const res = await getAdminBundleById(id);
    if (res?.data) {
      return {
        title: isAr
          ? `تعديل ${res.data.title} | إدارة ميري`
          : `Edit ${res.data.title} | MIRÉ Admin`,
        description: res.data.description?.slice(0, 160),
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr
      ? "تعديل الباقة والعرض | إدارة ميري"
      : "Edit Bundle & Offer | MIRÉ Admin",
  };
}

async function AdminEditBundleContent({
  params,
}: AdminEditBundlePageProps) {
  const { locale, id } = await params;
  await requirePermission(PERMISSIONS.BUNDLES_UPDATE, locale);

  let bundle;
  let categories: CategoryItem[] = [];
  let initialProducts: Product[] = [];

  try {
    const [bundleRes, categoriesRes, productsRes] = await Promise.all([
      getAdminBundleById(id),
      getCategories(),
      getAdminProducts({ limit: 12 }),
    ]);

    if (!bundleRes?.data) {
      notFound();
    }

    bundle = bundleRes.data;
    categories = categoriesRes;
    if (productsRes?.success && Array.isArray(productsRes.data)) {
      initialProducts = productsRes.data;
    }
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 404) notFound();
      if (error.status === 403) redirect(`/${locale}/403`);
    }
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <BundleForm
        categories={categories}
        initialProducts={initialProducts}
        initialBundle={bundle}
        isEditMode
      />
    </main>
  );
}

export default function AdminEditBundlePage(props: AdminEditBundlePageProps) {
  return (
    <Suspense fallback={<AdminEditBundleLoading />}>
      <AdminEditBundleContent {...props} />
    </Suspense>
  );
}
