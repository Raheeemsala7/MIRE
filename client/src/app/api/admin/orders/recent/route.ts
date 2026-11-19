import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { backendGet, BackendAuthError } from "@/lib/auth/backend-client";
import type { RecentOrderItem } from "@/features/analytics/types/analytics.types";

interface RawOrderResponse {
  success: boolean;
  data: Array<{
    _id: string;
    orderNumber: string;
    customerInfo?: { fullName?: string; phone?: string; email?: string };
    pricing?: { subtotal?: number; shippingFee?: number; discount?: number; totalAmount?: number };
    paymentInfo?: { method?: string; status?: string };
    status: string;
    createdAt: string;
    items?: Array<unknown>;
  }>;
}

export async function GET(request: NextRequest) {
  const session = await currentSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "6";

  try {
    const response = await backendGet<RawOrderResponse>(
      `/orders?limit=${limit}&sort=-createdAt` as `/${string}`,
      session.accessToken
    );

    const orders: RecentOrderItem[] = (response.data || []).map((o) => ({
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

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json(
        { success: false, error: "Backend service error" },
        { status: error.status }
      );
    }
    console.error("Failed to fetch recent orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders from backend service" },
      { status: 502 }
    );
  }
}
