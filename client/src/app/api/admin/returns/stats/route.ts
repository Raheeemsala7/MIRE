import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type {
  ReturnsPaginatedResponse,
  ReturnsOverviewStats,
} from "@/features/returns/types/return.types";

export async function GET() {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_VIEW
  );

  if (!authorization.authorized) {
    return NextResponse.json(
      { success: false, error: authorization.error },
      { status: authorization.status }
    );
  }

  try {
    const [
      totalRes,
      pendingRes,
      approvedRes,
      pickupRes,
      pickedUpRes,
      receivedRes,
      inspectedRes,
      refundedRes,
      rejectedRes,
    ] = await Promise.all([
      serverApiGet<ReturnsPaginatedResponse>("/returns?limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=RETURN_REQUESTED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=RETURN_APPROVED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=PICKUP_SCHEDULED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=PICKED_UP&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=RECEIVED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=INSPECTED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=REFUNDED&limit=1"),
      serverApiGet<ReturnsPaginatedResponse>("/returns?status=REJECTED&limit=1"),
    ]);

    const stats: ReturnsOverviewStats = {
      total: totalRes?.total ?? 0,
      pending: pendingRes?.total ?? 0,
      approved: approvedRes?.total ?? 0,
      inTransit:
        (pickupRes?.total ?? 0) +
        (pickedUpRes?.total ?? 0) +
        (receivedRes?.total ?? 0),
      inspected: inspectedRes?.total ?? 0,
      refunded: refundedRes?.total ?? 0,
      rejected: rejectedRes?.total ?? 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
