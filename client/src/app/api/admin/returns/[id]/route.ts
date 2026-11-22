import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SingleReturnResponse } from "@/features/returns/types/return.types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Return ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await serverApiGet<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
