import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { backendGet, backendPatch, BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission, validateEmployeeMutation } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SingleEmployeeResponse } from "@/features/employees/types/employee.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await currentSession();
  const auth = assertSessionPermission(session, PERMISSIONS.EMPLOYEES_TOGGLE_STATUS);

  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Fetch target employee to verify role and self-status
  let targetEmployee: SingleEmployeeResponse["data"];
  try {
    const targetRes = await backendGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`,
      session!.accessToken
    );
    targetEmployee = targetRes.data;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to inspect target employee status" },
      { status: 502 }
    );
  }

  // Enforce security constraints: self-lockout prevention, super admin deactivation prevention
  const validation = validateEmployeeMutation({
    actingUser: session!.user,
    targetUserId: id,
    targetUserRole: targetEmployee.role,
    isStatusToggle: true,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.message, message: validation.message },
      { status: validation.statusCode || 403 }
    );
  }

  try {
    const response = await backendPatch<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}/toggle-status` as `/${string}`,
      {},
      session!.accessToken
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
      { success: false, error: "Failed to toggle employee status in backend service" },
      { status: 502 }
    );
  }
}
