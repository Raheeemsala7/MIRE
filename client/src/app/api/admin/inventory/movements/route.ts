import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { InventoryMovementsPaginatedResponse } from "@/features/inventory/types/inventory.types";

export async function GET(request: NextRequest) {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.INVENTORY_VIEW
  );

  if (!authorization.authorized) {
    return NextResponse.json(
      { success: false, error: authorization.error },
      { status: authorization.status }
    );
  }

  // Parameters
  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const productId = searchParams.get("productId");
  const variantSku = searchParams.get("variantSku");
  const type = searchParams.get("type");
  const sortBy = searchParams.get("sortBy") || searchParams.get("sort");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (productId && productId.trim()) query.set("productId", productId.trim());
  if (variantSku && variantSku.trim()) query.set("variantSku", variantSku.trim());
  if (type && type !== "ALL") query.set("type", type.trim());
  if (sortBy) query.set("sortBy", sortBy);

  // Execution
  try {
    const response = await serverApiGet<InventoryMovementsPaginatedResponse>(
      `/inventory/movements${query.toString() ? `?${query.toString()}` : ""}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
