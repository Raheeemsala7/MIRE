import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { EmployeesPaginatedResponse } from "@/features/employees/types/employee.types";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const authorization = assertSessionPermission(session, PERMISSIONS.EMPLOYEES_VIEW);

  if (!authorization.authorized) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const role = searchParams.get("role");
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");
  const sort = searchParams.get("sort");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (role) query.set("role", role);
  if (search) query.set("search", search);
  if (isActive !== null && isActive !== "") query.set("isActive", isActive);
  if (sort) query.set("sort", sort);

  try {
    const response = await serverApiGet<EmployeesPaginatedResponse>(
      `/employees${query.toString() ? `?${query.toString()}` : ""}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
