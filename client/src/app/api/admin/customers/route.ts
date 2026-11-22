import { serverApiGet } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { CustomersPaginatedResponse } from "@/features/customers/types/customer.types";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.CUSTOMERS_VIEW
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
  const sortBy = searchParams.get("sortBy");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (search && search.trim()) query.set("search", search.trim());
  if (sortBy) query.set("sortBy", sortBy);

  try {
    const response = await serverApiGet<CustomersPaginatedResponse>(
      `/customers${query.toString() ? `?${query.toString()}` : ""}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.messageText || "Backend error",
          errors: error.errors,
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers from backend service" },
      { status: 502 }
    );
  }
}
