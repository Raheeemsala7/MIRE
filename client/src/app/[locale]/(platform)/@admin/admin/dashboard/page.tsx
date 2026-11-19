import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRole, serverApiGet } from "@/lib/auth/session";
import {
  AnalyticsDashboard,
  DashboardSkeleton,
  type DashboardCompositeData,
  type AnalyticsDashboardData,
  type RecentOrderItem,
  type LowStockItem,
} from "@/features/analytics";

export const instant = false;

interface AdminDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdminDashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "لوحة مؤشرات الأداء | إدارة ميري" : "Analytics Dashboard | MIRÉ Admin",
    description: isAr
      ? "لوحة التحكم التنفيذية ومؤشرات الأداء المباشرة لعلامة ميري"
      : "Executive analytics and operational insights for MIRÉ Administration",
  };
}

interface RawOrder {
  _id: string;
  orderNumber?: string;
  customerInfo?: { fullName?: string; phone?: string; email?: string };
  pricing?: { subtotal?: number; shippingFee?: number; discount?: number; totalAmount?: number };
  paymentInfo?: { method?: string; status?: string };
  status?: string;
  createdAt?: string;
  items?: unknown[];
}

async function getInitialDashboardData(): Promise<DashboardCompositeData> {
  let analytics: AnalyticsDashboardData | undefined = undefined;
  let recentOrders: RecentOrderItem[] | undefined = undefined;
  let lowStockItems: LowStockItem[] | undefined = undefined;

  try {
    // Parallel server-side fetch with isolated error resilience
    const results = await Promise.allSettled([
      serverApiGet<{ success: boolean; data: AnalyticsDashboardData }>("/analytics/dashboard?range=30d"),
      serverApiGet<{ success: boolean; data: RawOrder[] }>("/orders?limit=6&sort=-createdAt"),
      serverApiGet<{ success: boolean; data: LowStockItem[] }>("/inventory/low-stock"),
    ]);

    if (results[0].status === "fulfilled" && results[0].value?.data) {
      analytics = results[0].value.data;
    }

    if (results[1].status === "fulfilled" && Array.isArray(results[1].value?.data)) {
      recentOrders = results[1].value.data.map((o) => ({
        _id: String(o._id),
        orderNumber: o.orderNumber || "N/A",
        customerInfo: {
          fullName: o.customerInfo?.fullName || "Guest Customer",
          phone: o.customerInfo?.phone,
          email: o.customerInfo?.email,
        },
        pricing: {
          subtotal: o.pricing?.subtotal || 0,
          shippingFee: o.pricing?.shippingFee || 0,
          discount: o.pricing?.discount || 0,
          totalAmount: o.pricing?.totalAmount || 0,
        },
        paymentInfo: {
          method: o.paymentInfo?.method || "COD",
          status: o.paymentInfo?.status || "PENDING",
        },
        status: o.status || "NEW",
        createdAt: o.createdAt || new Date().toISOString(),
        itemsCount: Array.isArray(o.items) ? o.items.length : 1,
      }));
    }

    if (results[2].status === "fulfilled" && Array.isArray(results[2].value?.data)) {
      lowStockItems = results[2].value.data;
    }
  } catch {
    // Graceful degradation: client hooks will query with fresh auth
  }

  return { analytics, recentOrders, lowStockItems };
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { locale } = await params;
  await requireRole(["ADMIN", "SUPER_ADMIN"], locale);

  const initialData = await getInitialDashboardData();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsDashboard initialData={initialData} locale={locale} />
      </Suspense>
    </main>
  );
}
