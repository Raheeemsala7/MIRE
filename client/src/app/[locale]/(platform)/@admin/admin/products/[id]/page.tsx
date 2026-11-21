import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import { ProductDetails } from "@/features/products";
import { getAdminProductById } from "@/features/products/server/queries";
import AdminProductDetailLoading from "./loading";

interface AdminProductDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminProductDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    const res = await getAdminProductById(id);
    if (res?.data) {
      return {
        title: isAr
          ? `${res.data.name} | إدارة ميري`
          : `${res.data.name} | MIRÉ Admin`,
        description: res.data.description?.slice(0, 160),
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr ? "تفاصيل المنتج | إدارة ميري" : "Product Details | MIRÉ Admin",
  };
}

async function AdminProductDetailContent({
  params,
}: AdminProductDetailPageProps) {
  const { locale, id } = await params;
  const user = await requirePermission(PERMISSIONS.PRODUCTS_VIEW, locale);

  let product;
  try {
    const res = await getAdminProductById(id);
    if (!res?.data) {
      notFound();
    }
    product = res.data;
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 404) notFound();
      if (error.status === 403) redirect(`/${locale}/403`);
    }
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductDetails product={product} currentUser={user} />
    </main>
  );
}

export default function AdminProductDetailPage(
  props: AdminProductDetailPageProps
) {
  return (
    <Suspense fallback={<AdminProductDetailLoading />}>
      <AdminProductDetailContent {...props} />
    </Suspense>
  );
}
