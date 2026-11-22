import { hasPermission, isAdminRole } from "@/lib/auth/roles";
import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import type { LowStockItem } from "@/features/analytics/types/analytics.types";

interface RawLowStockResponse {
  success: boolean;
  data: LowStockItem[];
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user || !isAdminRole(session.user.role) || !hasPermission(session.user, "inventory:read")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: session?.user ? 403 : 401 });
  }

  try {
    const response = await serverApiGet<RawLowStockResponse>(
      "/inventory/low-stock"
    );
    return NextResponse.json({ success: true, data: response.data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
