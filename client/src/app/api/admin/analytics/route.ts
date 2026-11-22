import { hasPermission, isAdminRole } from "@/lib/auth/roles";
import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
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
    return handleApiError(error);
  }
}
