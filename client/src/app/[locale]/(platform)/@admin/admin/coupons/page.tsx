import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { PERMISSIONS } from "@/config/rbac.config";
import { CouponsManager, type CouponItem } from "@/features/admin/coupons";

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
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch {
    // fallback
  }

  return [
    {
      _id: "c-welcome10",
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 300,
      startDate: new Date("2026-01-01").toISOString(),
      endDate: new Date("2027-12-31").toISOString(),
      usageLimit: 500,
      usedCount: 38,
      maxUsesPerCustomer: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "c-summer20",
      code: "SUMMER20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderAmount: 1000,
      maxDiscountAmount: 500,
      startDate: new Date("2026-05-01").toISOString(),
      endDate: new Date("2027-09-01").toISOString(),
      usageLimit: 200,
      usedCount: 74,
      maxUsesPerCustomer: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "c-save100",
      code: "SAVE100",
      discountType: "FIXED_AMOUNT",
      discountValue: 100,
      minOrderAmount: 800,
      startDate: new Date("2026-01-01").toISOString(),
      endDate: new Date("2027-12-31").toISOString(),
      usageLimit: 100,
      usedCount: 19,
      maxUsesPerCustomer: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-brand-serif text-ds-text-plain">
          {isAr ? "الكوبونات وقسائم الخصم" : "Coupons & Discounts"}
        </h1>
        <p className="text-sm text-ds-text-soft mt-1">
          {isAr
            ? "إنشاء وإدارة كوبونات الخصم وقسائم الشراء والعروض الترويجية المخصصة للمتسوقات"
            : "Create and manage promotional discount codes and cart vouchers for customers."}
        </p>
      </div>

      <Suspense fallback={<div className="h-96 rounded-3xl bg-ds-elevated animate-pulse" />}>
        <CouponsManager initialCoupons={initialCoupons} />
      </Suspense>
    </div>
  );
}
