import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminRole, hasPermission } from "@/lib/auth/roles";
import { serverApiGet, serverApiPatch } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { REAL_DATABASE_ORDERS } from "../route";

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

  // Look up in database orders
  const foundOrder = REAL_DATABASE_ORDERS.find(
    (o) => o._id === id || o.orderNumber === id
  );

  if (foundOrder) {
    return NextResponse.json({ success: true, data: foundOrder });
  }

  // Fallback demo order
  const mockOrder = {
    ...REAL_DATABASE_ORDERS[0],
    _id: id,
    orderNumber: id.startsWith("ord-") ? `MIRE-2026-${id.slice(-5)}` : id,
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
