import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { backendGet, BackendAuthError } from "@/lib/auth/backend-client";
import type { AnalyticsDashboardData } from "@/features/analytics/types/analytics.types";

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function GET(request: NextRequest) {
  const session = await currentSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
    const response = await backendGet<BackendResponse<AnalyticsDashboardData>>(
      `/analytics/dashboard?${queryParams.toString()}` as `/${string}`,
      session.accessToken
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendAuthError) {
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
