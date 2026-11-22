import { serverApiGet } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { CustomerDetailsResponse } from "@/features/customers/types/customer.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  try {
    const response = await serverApiGet<CustomerDetailsResponse>(
      `/customers/${encodeURIComponent(id)}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText, message: error.messageText },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer details" },
      { status: 502 }
    );
  }
}
