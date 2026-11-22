import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { ReturnsPaginatedResponse } from "@/features/returns/types/return.types";

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const assignedEmployee = searchParams.get("assignedEmployee");
  const sort = searchParams.get("sort");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (status && status !== "ALL") query.set("status", status);
  if (search && search.trim()) query.set("search", search.trim());
  if (assignedEmployee) query.set("assignedEmployee", assignedEmployee);
  if (sort) query.set("sort", sort);

  try {
    const response = await serverApiGet<ReturnsPaginatedResponse>(
      `/returns${query.toString() ? `?${query.toString()}` : ""}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
