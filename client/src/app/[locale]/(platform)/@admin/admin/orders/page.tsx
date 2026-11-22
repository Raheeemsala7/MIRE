import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  OrdersTable,
  type OrderDoc,
  type OrdersPaginatedResponse,
} from "@/features/admin/orders";

interface AdminOrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminOrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة الطلبات | لوحة تحكم ميري"
      : "Orders Management | MIRÉ Admin",
    description: isAr
      ? "متابعة وإدارة طلبات العملاء وتحديث حالات الشحن والتجهيز"
      : "Manage orders, update shipment and fulfillment statuses.",
  };
}

const FALLBACK_ORDERS: OrderDoc[] = [
  {
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
  },
  {
    _id: "ord-mire-002",
    orderNumber: "MIRE-2026-00041",
    customerInfo: {
      fullName: "سارة محمد الشريف",
      phone: "+201198765432",
      email: "sarah.elsharif@example.com",
    },
    shippingAddress: {
      street: "شارع مصطفى النحاس، المنطقة الثامنة",
      building: "برج الزهور 2",
      apartment: "شقة 402",
      city: "Nasr City",
      governorate: "Cairo",
      country: "Egypt",
      landmark: "أمام مدرسة المنهل",
      latitude: 30.0444,
      longitude: 31.3400,
    },
    items: [
      {
        _id: "it-3",
        name: "طقم كريب شيفون ملكي فاخر",
        sku: "SET-CRP-ROYAL-L",
        color: "Royal Beige",
        size: "L",
        quantity: 1,
        unitPrice: 1950,
        subtotal: 1950,
      },
    ],
    pricing: {
      subtotal: 1950,
      shippingFee: 0,
      totalAmount: 1950,
    },
    paymentInfo: {
      method: "PAYMOB",
      status: "PAID",
    },
    status: "SHIPPED",
    orderNotes: "التسليم في الفترة المسائية",
    statusHistory: [
      {
        status: "NEW",
        reason: "تم استلام الطلب ودفع القيمة إلكترونياً",
        timestamp: "2026-11-20T14:10:00.000Z",
      },
      {
        status: "CONFIRMED",
        reason: "الدفع معتمد وتأكيد الطلب",
        timestamp: "2026-11-20T14:15:00.000Z",
      },
      {
        status: "PROCESSING",
        reason: "تم التجهيز والفحص النهائي",
        timestamp: "2026-11-20T16:00:00.000Z",
      },
      {
        status: "SHIPPED",
        reason: "خرج مع مندوب التوصيل (شركة أرامكس)",
        timestamp: "2026-11-21T09:30:00.000Z",
      },
    ],
    createdAt: "2026-11-20T14:10:00.000Z",
  },
  {
    _id: "ord-mire-003",
    orderNumber: "MIRE-2026-00040",
    customerInfo: {
      fullName: "مريم عبد الرحمن",
      phone: "+201234567890",
      email: "mariam.abdo@example.com",
    },
    shippingAddress: {
      street: "طريق الجيش، سان ستيفانو",
      building: "عمارة الفيروز",
      apartment: "شقة 12",
      city: "Alexandria",
      governorate: "Alexandria",
      country: "Egypt",
      landmark: "بجوار فندق فورسيزونز",
      latitude: 31.2443,
      longitude: 29.9678,
    },
    items: [
      {
        _id: "it-4",
        name: "عباية حرير مطرزة بقصة انسيابية",
        sku: "ABY-SLK-SLV-S",
        color: "Silver White",
        size: "S",
        quantity: 1,
        unitPrice: 1450,
        subtotal: 1450,
      },
    ],
    pricing: {
      subtotal: 1450,
      shippingFee: 50,
      totalAmount: 1500,
    },
    paymentInfo: {
      method: "COD",
      status: "PAID",
    },
    status: "DELIVERED",
    statusHistory: [
      {
        status: "NEW",
        reason: "طلب جديد عبر المتجر",
        timestamp: "2026-11-19T11:00:00.000Z",
      },
      {
        status: "CONFIRMED",
        reason: "تأكيد الطلب",
        timestamp: "2026-11-19T11:45:00.000Z",
      },
      {
        status: "PROCESSING",
        reason: "تم التجهيز",
        timestamp: "2026-11-19T14:00:00.000Z",
      },
      {
        status: "SHIPPED",
        reason: "شحن سريع للإسكندرية",
        timestamp: "2026-11-20T08:00:00.000Z",
      },
      {
        status: "DELIVERED",
        reason: "تم استلام الطلب وتحصيل المبلغ نقداً",
        timestamp: "2026-11-21T15:20:00.000Z",
      },
    ],
    createdAt: "2026-11-19T11:00:00.000Z",
  },
  {
    _id: "ord-mire-004",
    orderNumber: "MIRE-2026-00039",
    customerInfo: {
      fullName: "ياسمين كمال الدين",
      phone: "+201011223344",
      email: "yasmin.kamal@example.com",
    },
    shippingAddress: {
      street: "شارع التسعين الشمالي، التجمع الخامس",
      building: "فيلا 88",
      city: "New Cairo",
      governorate: "Cairo",
      country: "Egypt",
      landmark: "حي النرجس",
      latitude: 30.0150,
      longitude: 31.4920,
    },
    items: [
      {
        _id: "it-5",
        name: "طقم كريب شيفون ملكي فاخر",
        sku: "SET-CRP-ROYAL-M",
        color: "Royal Beige",
        size: "M",
        quantity: 1,
        unitPrice: 1950,
        subtotal: 1950,
      },
    ],
    pricing: {
      subtotal: 1950,
      shippingFee: 0,
      totalAmount: 1950,
    },
    paymentInfo: {
      method: "COD",
      status: "PENDING",
    },
    status: "NEW",
    statusHistory: [
      {
        status: "NEW",
        reason: "تم إنشاء الطلب حديثاً عبر المتجر",
        timestamp: "2026-11-22T02:15:00.000Z",
      },
    ],
    createdAt: "2026-11-22T02:15:00.000Z",
  },
];

async function getInitialOrdersData(
  locale: string,
  searchParams?: { [key: string]: string | string[] | undefined }
): Promise<{ orders: OrderDoc[]; total: number }> {
  const query = new URLSearchParams();
  const page = typeof searchParams?.page === "string" ? searchParams.page : "1";
  const limit = typeof searchParams?.limit === "string" ? searchParams.limit : "20";
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const search = typeof searchParams?.search === "string" ? searchParams.search.trim() : "";

  query.set("page", page);
  query.set("limit", limit);
  if (status && status !== "ALL") query.set("status", status);
  if (search) query.set("search", search);

  try {
    const response = await serverApiGet<OrdersPaginatedResponse>(
      `/orders?${query.toString()}` as `/${string}`
    );
    if (response?.success && Array.isArray(response.data)) {
      return { orders: response.data, total: response.total ?? response.data.length };
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
  }

  // Fallback demo data
  let filtered = [...FALLBACK_ORDERS];
  if (status && status !== "ALL") {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerInfo?.fullName?.toLowerCase().includes(term) ||
        o.customerInfo?.phone?.includes(term)
    );
  }

  return { orders: filtered, total: filtered.length };
}

export default async function AdminOrdersPage(props: AdminOrdersPageProps) {
  const { locale } = await props.params;
  const rawSearchParams = props.searchParams ? await props.searchParams : undefined;

  await requirePermission(PERMISSIONS.ORDERS_VIEW, locale);

  const { orders, total } = await getInitialOrdersData(locale, rawSearchParams);

  return (
    <Suspense fallback={<OrdersLoadingSkeleton />}>
      <OrdersTable initialOrders={orders} totalCount={total} />
    </Suspense>
  );
}

function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-muted/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-muted/40" />
    </div>
  );
}
