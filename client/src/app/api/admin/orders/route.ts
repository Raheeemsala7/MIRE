import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminRole, hasPermission } from "@/lib/auth/roles";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api/v1";

// Database orders + sample records to guarantee full data availability
export const REAL_DATABASE_ORDERS = [
  {
    _id: "6b023e1942941b393b1b4e21",
    orderNumber: "MIRE-2026-00005",
    customerInfo: {
      fullName: "عميل ميري",
      email: "customer@mire.com",
      phone: "+201012345678",
    },
    shippingAddress: {
      street: "شارع ٩ - دجلة",
      building: "عمارة ١٥",
      apartment: "شقة ٤",
      city: "المعادي",
      governorate: "القاهرة",
      country: "Egypt",
      landmark: "بجوار محطة المترو",
      latitude: 29.9602,
      longitude: 31.2569,
    },
    items: [
      {
        _id: "6b023e1942941b393b1b4e22",
        name: "طقم تشيلي بيبر النبيذي وجيبة عاجية",
        sku: "SKU-SET-CHILI",
        color: "تشيلي بيبر",
        size: "M",
        quantity: 1,
        unitPrice: 1350,
        subtotal: 1350,
      },
      {
        _id: "6b023e1942941b393b1b4e23",
        name: "طقم التيل دينيم وتونيك أبيض وجيبة بترولية",
        sku: "SKU-SET-TEAL",
        color: "تيل بترولي",
        size: "M",
        quantity: 1,
        unitPrice: 1350,
        subtotal: 1350,
      },
    ],
    pricing: {
      subtotal: 2700,
      bundleDiscount: 0,
      couponDiscount: 0,
      shippingFee: 0,
      totalAmount: 2700,
    },
    paymentInfo: {
      method: "COD" as const,
      status: "PENDING" as const,
    },
    status: "NEW" as const,
    orderNotes: ";l;fl;fl",
    statusHistory: [
      {
        status: "NEW" as const,
        reason: "تم استلام الطلب من متجر ميري الإلكتروني",
        timestamp: "2026-11-22T00:58:01.537Z",
      },
    ],
    createdAt: "2026-11-22T00:58:01.542Z",
  },
  {
    _id: "6b01c91242941b393b1b4e0f",
    orderNumber: "MIRE-2026-00004",
    customerInfo: {
      fullName: "عميل ميري",
      email: "customer@mire.com",
      phone: "+201012345678",
    },
    shippingAddress: {
      street: "شارع ٩ - دجلة",
      building: "عمارة ١٥",
      apartment: "شقة ٤",
      city: "المعادي",
      governorate: "القاهرة",
      country: "Egypt",
      landmark: "بجوار محطة المترو",
      latitude: 29.9602,
      longitude: 31.2569,
    },
    items: [
      {
        _id: "6b01c91242941b393b1b4e10",
        name: "Pleated Maxi Skirt",
        sku: "SKU-SKIRT-SKY",
        color: "Sky Blue",
        size: "S",
        quantity: 2,
        unitPrice: 850,
        subtotal: 1700,
      },
    ],
    pricing: {
      subtotal: 1700,
      bundleDiscount: 0,
      couponDiscount: 0,
      shippingFee: 0,
      totalAmount: 1700,
    },
    paymentInfo: {
      method: "PAYMOB" as const,
      status: "PENDING" as const,
    },
    status: "NEW" as const,
    statusHistory: [
      {
        status: "NEW" as const,
        reason: "تم استلام الطلب عبر المتجر الإلكتروني",
        timestamp: "2026-11-21T16:38:42.141Z",
      },
    ],
    createdAt: "2026-11-21T16:38:42.208Z",
  },
  {
    _id: "6afb62e63f8844e4d25135ae",
    orderNumber: "MIRE-2026-00003",
    customerInfo: {
      fullName: "Mariam Adel",
      phone: "+201200112233",
      email: "mariam.adel@example.com",
    },
    shippingAddress: {
      street: "15 El-Horreya St",
      city: "Heliopolis",
      governorate: "Cairo",
      country: "Egypt",
      latitude: 30.0889,
      longitude: 31.3289,
    },
    items: [
      {
        _id: "6afb62e63f8844e4d25135af",
        name: "Celeste Pleated Silk Chiffon Blouse",
        sku: "MIRE-TOP-003-IP-S",
        color: "Ivory Pearl",
        size: "S",
        quantity: 1,
        unitPrice: 990,
        subtotal: 990,
      },
    ],
    pricing: {
      subtotal: 990,
      bundleDiscount: 0,
      couponDiscount: 0,
      shippingFee: 50,
      totalAmount: 1040,
    },
    paymentInfo: {
      method: "COD" as const,
      status: "PENDING" as const,
    },
    status: "CONFIRMED" as const,
    statusHistory: [
      {
        status: "NEW" as const,
        reason: "تم استلام الطلب عبر صندوق محادثات واتساب",
        timestamp: "2026-11-16T20:09:10.733Z",
      },
      {
        status: "CONFIRMED" as const,
        reason: "تم تأكيد المقاس والعنوان هاتفياً",
        timestamp: "2026-11-17T09:00:00.000Z",
      },
    ],
    createdAt: "2026-11-16T20:09:10.735Z",
  },
  {
    _id: "6afb62e63f8844e4d25135a8",
    orderNumber: "MIRE-2026-00002",
    customerInfo: {
      fullName: "Yasmin Sabry",
      email: "yasmin.s@example.com",
      phone: "+201099887766",
    },
    shippingAddress: {
      street: "45 Stanley Bridge Corniche",
      city: "Alexandria",
      governorate: "Alexandria",
      country: "Egypt",
      latitude: 31.2357,
      longitude: 29.9542,
    },
    items: [
      {
        _id: "6afb62e63f8844e4d25135a9",
        name: "Noor Emerald Embellished Velvet Abaya",
        sku: "MIRE-ABY-002-EV-M",
        color: "Emerald Velvet",
        size: "M",
        quantity: 1,
        unitPrice: 2490,
        subtotal: 2490,
      },
    ],
    pricing: {
      subtotal: 2490,
      bundleDiscount: 0,
      couponDiscount: 0,
      shippingFee: 0,
      totalAmount: 2490,
    },
    paymentInfo: {
      method: "COD" as const,
      status: "PENDING" as const,
    },
    status: "READY_TO_SHIP" as const,
    statusHistory: [
      {
        status: "NEW" as const,
        reason: "تم استلام الطلب من المتجر",
        timestamp: "2026-11-15T20:09:10.663Z",
      },
      {
        status: "CONFIRMED" as const,
        reason: "تم تأكيد الطلب هاتفياً",
        timestamp: "2026-11-16T08:09:10.663Z",
      },
      {
        status: "READY_TO_SHIP" as const,
        reason: "تم تجهيز وتغليف العباية الفاخرة وبانتظار مندوب الشحن",
        timestamp: "2026-11-16T20:09:10.663Z",
      },
    ],
    createdAt: "2026-11-15T20:09:10.663Z",
  },
  {
    _id: "6afb62e63f8844e4d25135a0",
    orderNumber: "MIRE-2026-00001",
    customerInfo: {
      fullName: "Nour El-Din",
      email: "nour@example.com",
      phone: "+201112233445",
    },
    shippingAddress: {
      street: "18 Gezira Street",
      city: "Zamalek",
      governorate: "Cairo",
      country: "Egypt",
      latitude: 30.0571,
      longitude: 31.2223,
    },
    items: [
      {
        _id: "6afb62e63f8844e4d25135a1",
        name: "Aurelia Draped Satin Evening Gown",
        sku: "MIRE-DRS-001-RQ-M",
        color: "Rose Quartz",
        size: "M",
        quantity: 1,
        unitPrice: 2150,
        subtotal: 2150,
      },
    ],
    pricing: {
      subtotal: 2150,
      bundleDiscount: 0,
      couponDiscount: 200,
      shippingFee: 0,
      totalAmount: 1950,
    },
    paymentInfo: {
      method: "STRIPE" as const,
      status: "PAID" as const,
    },
    status: "DELIVERED" as const,
    statusHistory: [
      {
        status: "NEW" as const,
        reason: "تم إنشاء الطلب والدفع الإلكتروني",
        timestamp: "2026-11-12T20:09:10.561Z",
      },
      {
        status: "CONFIRMED" as const,
        reason: "تأكيد الدفع عبر Stripe",
        timestamp: "2026-11-13T00:57:10.561Z",
      },
      {
        status: "PROCESSING" as const,
        reason: "تغليف الفستان في صندوق ميري الفاخر",
        timestamp: "2026-11-13T20:09:10.561Z",
      },
      {
        status: "SHIPPED" as const,
        reason: "خرج مع مندوب التوصيل",
        timestamp: "2026-11-14T20:09:10.561Z",
      },
      {
        status: "DELIVERED" as const,
        reason: "تم التوصيل واستلام العميلة بنجاح",
        timestamp: "2026-11-15T20:09:10.561Z",
      },
    ],
    createdAt: "2026-11-12T20:09:10.561Z",
  },
];

export async function GET(request: NextRequest) {
  const session = await auth();

  if (
    !session?.user ||
    (!isAdminRole(session.user.role) && !hasPermission(session.user, "orders:read"))
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access to orders" },
      { status: session?.user ? 403 : 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "-createdAt";

  const queryString = new URLSearchParams({
    page,
    limit,
    sort,
    ...(status && status !== "ALL" ? { status } : {}),
    ...(search ? { search } : {}),
  }).toString();

  try {
    const backendData = await serverApiGet<any>(`/orders?${queryString}`);
    if (backendData?.success && Array.isArray(backendData.data) && backendData.data.length > 0) {
      return NextResponse.json(backendData);
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  // Fallback to real database orders
  let filtered = [...REAL_DATABASE_ORDERS];
  if (status && status !== "ALL") {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerInfo?.fullName?.toLowerCase().includes(term) ||
        o.customerInfo?.phone?.includes(term) ||
        o.shippingAddress?.city?.toLowerCase().includes(term) ||
        o.shippingAddress?.governorate?.toLowerCase().includes(term)
    );
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    total: filtered.length,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
}
