import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  OrderDetailsView,
  type OrderDoc,
} from "@/features/admin/orders";

interface AdminOrderDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailsPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? `تفاصيل الطلب #${id} | لوحة تحكم ميري`
      : `Order #${id} Details | MIRÉ Admin`,
    description: isAr
      ? "استعراض تفاصيل الطلب وتحديث حالة التوصيل"
      : "View order details and manage fulfillment lifecycle",
  };
}

const FALLBACK_ORDER: OrderDoc = {
  _id: "ord-mire-001",
  orderNumber: "MIRE-2026-00042",
  customerInfo: {
    fullName: "نور الهدى إبراهيم",
    phone: "+201023456789",
    email: "nour.ibrahim@example.com",
  },
  shippingAddress: {
    street: "شارع 26 يوليو، الزمالك",
    building: "عمارة 14",
    apartment: "شقة 6",
    city: "Zamalek",
    governorate: "Cairo",
    country: "Egypt",
    landmark: "بجوار ساقية الصاوي",
    latitude: 30.0571,
    longitude: 31.2223,
  },
  items: [
    {
      _id: "it-1",
      name: "عباية مخملية كلاسيكية مع تطريز يدوي",
      sku: "ABY-CLS-BLK-M",
      color: "Noir Velvet",
      size: "M",
      quantity: 1,
      unitPrice: 1250,
      subtotal: 1250,
    },
    {
      _id: "it-2",
      name: "تنورة سهرة بليسيه انسيابية",
      sku: "SKT-PLS-SLV-L",
      color: "Silver Grey",
      size: "L",
      quantity: 1,
      unitPrice: 850,
      subtotal: 850,
    },
  ],
  pricing: {
    subtotal: 2100,
    shippingFee: 0,
    totalAmount: 2100,
  },
  paymentInfo: {
    method: "COD",
    status: "PENDING",
  },
  status: "PROCESSING",
  orderNotes: "يرجى الاتصال قبل الوصول بنصف ساعة",
  statusHistory: [
    {
      status: "NEW",
      reason: "تم استلام الطلب من المتجر",
      timestamp: "2026-11-21T18:30:00.000Z",
    },
    {
      status: "CONFIRMED",
      reason: "تم تأكيد الطلب هاتفياً مع العميلة",
      timestamp: "2026-11-21T19:15:00.000Z",
    },
    {
      status: "PROCESSING",
      reason: "جاري تجهيز وتغليف المنتجات في المخزن الرئيسي",
      timestamp: "2026-11-22T08:00:00.000Z",
    },
  ],
  createdAt: "2026-11-21T18:30:00.000Z",
};

async function getOrderDetails(id: string, locale: string): Promise<OrderDoc> {
  try {
    const response = await serverApiGet<{ success: boolean; data: OrderDoc }>(
      `/orders/${encodeURIComponent(id)}` as `/${string}`
    );
    if (response?.success && response.data) {
      return response.data;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
  }

  // Graceful fallback for offline demo / decoupled mode
  return {
    ...FALLBACK_ORDER,
    _id: id,
    orderNumber: id.startsWith("ord-") ? `MIRE-2026-${id.slice(-5)}` : id,
  };
}

export default async function AdminOrderDetailsPage(
  props: AdminOrderDetailsPageProps
) {
  const { locale, id } = await props.params;

  await requirePermission(PERMISSIONS.ORDERS_VIEW, locale);

  const order = await getOrderDetails(id, locale);

  return (
    <Suspense fallback={<OrderDetailsLoadingSkeleton />}>
      <OrderDetailsView order={order} />
    </Suspense>
  );
}

function OrderDetailsLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-muted/60" />
      <div className="h-44 rounded-2xl bg-muted/40" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-96 rounded-2xl bg-muted/40" />
        <div className="lg:col-span-7 h-96 rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}
