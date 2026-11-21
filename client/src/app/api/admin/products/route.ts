import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { ProductsPaginatedResponse } from "@/features/products/types/product.types";

export async function GET(request: NextRequest) {
  const session = await auth();
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

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();

  // Forward supported backend query parameters
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const isFeatured = searchParams.get("isFeatured");
  const isNewArrival = searchParams.get("isNewArrival");
  const isBestSeller = searchParams.get("isBestSeller");
  const sortBy = searchParams.get("sortBy") || searchParams.get("sort");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (search && search.trim()) query.set("search", search.trim());
  if (category) query.set("category", category);
  if (status) query.set("status", status);
  if (minPrice) query.set("minPrice", minPrice);
  if (maxPrice) query.set("maxPrice", maxPrice);
  if (isFeatured) query.set("isFeatured", isFeatured);
  if (isNewArrival) query.set("isNewArrival", isNewArrival);
  if (isBestSeller) query.set("isBestSeller", isBestSeller);
  if (sortBy) query.set("sortBy", sortBy);
  query.set("admin", "true");

  try {
    const response = await serverApiGet<ProductsPaginatedResponse>(
      `/products?${query.toString()}` as `/${string}`
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
      { success: false, error: "Failed to fetch products from backend service" },
      { status: 502 }
    );
  }
}
