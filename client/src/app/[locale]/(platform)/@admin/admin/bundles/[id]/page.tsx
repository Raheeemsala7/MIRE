import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import { BundleDetails } from "@/features/bundles";
import { getAdminBundleById } from "@/features/bundles/apis/bundles.api";
import AdminBundleDetailLoading from "./loading";

interface AdminBundleDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminBundleDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    const res = await getAdminBundleById(id);
    if (res?.data) {
      return {
        title: isAr
          ? `${res.data.title} | إدارة ميري`
          : `${res.data.title} | MIRÉ Admin`,
        description: res.data.description?.slice(0, 160),
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr
      ? "تفاصيل الباقة والعرض | إدارة ميري"
      : "Bundle Details | MIRÉ Admin",
  };
}

async function AdminBundleDetailContent({
  params,
}: AdminBundleDetailPageProps) {
  const { locale, id } = await params;
  const user = await requirePermission(PERMISSIONS.BUNDLES_VIEW, locale);

  let bundle;
  try {
    const res = await getAdminBundleById(id);
    if (!res?.data) {
      notFound();
    }
    bundle = res.data;
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 404) notFound();
      if (error.status === 403) redirect(`/${locale}/403`);
    }
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BundleDetails bundle={bundle} currentUser={user} />
    </main>
  );
}

export default function AdminBundleDetailPage(
  props: AdminBundleDetailPageProps
) {
  return (
    <Suspense fallback={<AdminBundleDetailLoading />}>
      <AdminBundleDetailContent {...props} />
    </Suspense>
  );
}
