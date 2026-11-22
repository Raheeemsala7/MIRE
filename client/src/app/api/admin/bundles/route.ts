import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { BundlesPaginatedResponse } from "@/features/bundles/types/bundle.types";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.BUNDLES_VIEW
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
  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const activeOnly = searchParams.get("activeOnly");
  const sortBy = searchParams.get("sortBy") || searchParams.get("sort");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (search && search.trim()) query.set("search", search.trim());
  if (type) query.set("type", type);
  if (status) query.set("status", status);
  if (activeOnly) query.set("activeOnly", activeOnly);
  if (sortBy) query.set("sortBy", sortBy);

  try {
    const response = await serverApiGet<BundlesPaginatedResponse>(
      `/bundles${query.toString() ? `?${query.toString()}` : ""}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
