import { hasPermission, isAdminRole } from "@/lib/auth/roles";
import { serverApiGet } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
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
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: "Backend service error" },
        { status: error.status }
      );
    }
    console.error("Failed to fetch low stock alerts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory from backend service" },
      { status: 502 }
    );
  }
}
