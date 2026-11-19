import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { backendGet, BackendAuthError } from "@/lib/auth/backend-client";
import type { LowStockItem } from "@/features/analytics/types/analytics.types";

interface RawLowStockResponse {
  success: boolean;
  data: LowStockItem[];
}

export async function GET() {
  const session = await currentSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendGet<RawLowStockResponse>(
      "/inventory/low-stock",
      session.accessToken
    );
    return NextResponse.json({ success: true, data: response.data || [] });
  } catch (error) {
    if (error instanceof BackendAuthError) {
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
