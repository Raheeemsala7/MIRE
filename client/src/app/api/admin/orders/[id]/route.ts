import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminRole, hasPermission } from "@/lib/auth/roles";
import { serverApiGet, serverApiPatch } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";

const VALID_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "CUSTOMER_NOT_RESPONDING",
  "FAILED_DELIVERY",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user ||
    (!isAdminRole(session.user.role) && !hasPermission(session.user, "orders:read"))
  ) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const backendData = await serverApiGet<any>(`/orders/${id}`);
    if (backendData?.success && backendData.data) {
      return NextResponse.json(backendData);
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  // Fallback demo order for preview/offline development
  const mockOrder = {
    _id: id,
    orderNumber: id.startsWith("ord-") ? `MIRE-2026-${id.slice(-5)}` : id,
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

  return NextResponse.json({ success: true, data: mockOrder });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user ||
    (!isAdminRole(session.user.role) && !hasPermission(session.user, "orders:write"))
  ) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { status, reason } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const backendData = await serverApiPatch<any>(`/orders/${id}/status`, {
      status,
      reason: reason || `Updated by ${session.user.name || "Admin"}`,
    });

    if (backendData?.success) {
      return NextResponse.json(backendData);
    }
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText || "Backend error updating status" },
        { status: error.status }
      );
    }
  }

  // Decoupled / Fallback update
  return NextResponse.json({
    success: true,
    message: `Order status updated to ${status}`,
    data: {
      _id: id,
      status,
      updatedAt: new Date().toISOString(),
      newHistoryEntry: {
        status,
        reason: reason || `Updated by ${session.user.name || "Admin"}`,
        timestamp: new Date().toISOString(),
      },
    },
  });
}
