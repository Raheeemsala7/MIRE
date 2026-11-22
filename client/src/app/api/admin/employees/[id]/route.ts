import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SingleEmployeeResponse } from "@/features/employees/types/employee.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession();
  const authorization = assertSessionPermission(session, PERMISSIONS.EMPLOYEES_VIEW);

  if (!authorization.authorized) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const response = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
