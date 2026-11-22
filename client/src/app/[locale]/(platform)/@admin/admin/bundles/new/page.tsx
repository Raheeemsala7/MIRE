import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { BundleForm } from "@/features/bundles";
import { getCategories, getAdminProducts } from "@/features/products/apis/products.api";
import type { CategoryItem, Product } from "@/features/products";
import AdminNewBundleLoading from "./loading";

interface AdminNewBundlePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminNewBundlePageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إنشاء باقة أو عرض جديد | إدارة ميري"
      : "Create Bundle or Promotion | MIRÉ Admin",
    description: isAr
      ? "إنشاء باقة ترويجية جديدة، عروض BOGO، وخصومات الباقات للمتجر"
      : "Create a new promotional bundle, BOGO offer, or package discount for the storefront.",
  };
}

async function AdminNewBundleContent({ params }: AdminNewBundlePageProps) {
  const { locale } = await params;
  await requirePermission(PERMISSIONS.BUNDLES_CREATE, locale);

  let categories: CategoryItem[] = [];
  let initialProducts: Product[] = [];

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      getCategories(),
      getAdminProducts({ limit: 12 }),
    ]);

    categories = categoriesRes;
    if (productsRes?.success && Array.isArray(productsRes.data)) {
      initialProducts = productsRes.data;
    }
  } catch {
    categories = [];
    initialProducts = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <BundleForm
        categories={categories}
        initialProducts={initialProducts}
      />
    </main>
  );
}

export default function AdminNewBundlePage(props: AdminNewBundlePageProps) {
  return (
    <Suspense fallback={<AdminNewBundleLoading />}>
      <AdminNewBundleContent {...props} />
    </Suspense>
  );
}
