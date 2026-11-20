import { serverApiGet, serverApiPatch } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { updateCustomerSchema } from "@/features/customers/schemas/customer.schema";
import type {
  CustomerDetailsResponse,
  SingleCustomerResponse,
} from "@/features/customers/types/customer.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.CUSTOMERS_UPDATE
  );

  if (!authorization.authorized) {
    return NextResponse.json(
      { success: false, error: authorization.error },
      { status: authorization.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parseResult = updateCustomerSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation error",
        errors: parseResult.error.flatten(),
      },
      { status: 422 }
    );
  }

  const validatedData = parseResult.data;

  try {
    const response = await serverApiPatch<SingleCustomerResponse>(
      `/customers/${encodeURIComponent(id)}` as `/${string}`,
      validatedData
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
      { success: false, error: "Failed to update customer" },
      { status: 502 }
    );
  }
}
