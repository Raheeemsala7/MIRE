import { hasPermission, isAdminRole } from "@/lib/auth/roles";
import { serverApiGet } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import type { AnalyticsDashboardData } from "@/features/analytics/types/analytics.types";

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || !isAdminRole(session.user.role) || !hasPermission(session.user, "dashboard:read")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: session?.user ? 403 : 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const queryParams = new URLSearchParams();
  queryParams.set("range", range);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);

  try {
    const response = await serverApiGet<BackendResponse<AnalyticsDashboardData>>(
      `/analytics/dashboard?${queryParams.toString()}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: "Backend service error" },
        { status: error.status }
      );
    }
    console.error("Failed to fetch admin analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics from backend service" },
      { status: 502 }
    );
  }
}
