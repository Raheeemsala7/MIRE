import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SingleProductResponse } from "@/features/products/types/product.types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.PRODUCTS_VIEW
  );

  if (!authorization.authorized) {
    return NextResponse.json(
      { success: false, error: authorization.error },
      { status: authorization.status }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    const cleanId = encodeURIComponent(id.trim());
    const response = await serverApiGet<SingleProductResponse>(
      `/products/${cleanId}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
