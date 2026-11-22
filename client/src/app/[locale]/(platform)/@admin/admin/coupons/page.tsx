import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { PERMISSIONS } from "@/config/rbac.config";
import { CouponsManager, type CouponItem } from "@/features/admin/coupons";
import { getCoupons as getCouponsFromStore } from "@/lib/coupons-store";

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

async function getCoupons(): Promise<CouponItem[]> {
  try {
    const res = await serverApiGet<any>("/coupons");
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // fallback
  }

  return getCouponsFromStore() as CouponItem[];
}

export default async function AdminCouponsPage({
  params,
}: AdminCouponsPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  // Require coupons permissions
  await requirePermission(PERMISSIONS.COUPONS_VIEW, locale);

  const initialCoupons = await getCoupons();

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
