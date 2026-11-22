import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { CouponsManager } from "@/features/admin/coupons";
import { getAdminCouponsApi } from "@/features/admin/coupons/apis/coupons.api";

interface AdminCouponsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminCouponsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة الكوبونات والخصومات | لوحة تحكم ميري"
      : "Coupons & Promotions | MIRÉ Admin",
    description: isAr
      ? "إنشاء وإدارة كوبونات الخصم وقسائم الشراء والعروض الترويجية"
      : "Manage discount coupons, promotional codes, and cart vouchers.",
  };
}

export default async function AdminCouponsPage({
  params,
}: AdminCouponsPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  // Require coupons permissions on the server
  await requirePermission(PERMISSIONS.COUPONS_VIEW, locale);

  // Fetch real coupons directly from backend database using getAdminCouponsApi
  const initialCoupons = await getAdminCouponsApi();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ds-border-muted pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-brand-serif text-ds-text-plain">
            {isAr ? "الكوبونات وقسائم الخصم" : "Coupons & Discounts"}
          </h1>
          <p className="text-xs sm:text-sm text-ds-text-soft mt-1">
            {isAr
              ? "إنشاء وإدارة كوبونات الخصم وقسائم الشراء والعروض الترويجية المخصصة للمتسوقات"
              : "Create and manage promotional discount codes and cart vouchers for customers."}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 rounded-3xl bg-ds-elevated animate-pulse" />}>
        <CouponsManager initialCoupons={initialCoupons} />
      </Suspense>
    </main>
  );
}
