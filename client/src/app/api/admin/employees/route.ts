import { serverApiGet, serverApiPost } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission, validateEmployeeMutation } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { createEmployeeSchema } from "@/features/employees/schemas/employee.schema";
import type { EmployeesPaginatedResponse, SingleEmployeeResponse } from "@/features/employees/types/employee.types";

export async function GET(request: NextRequest) {
  const session = await auth();
  const authorization = assertSessionPermission(session, PERMISSIONS.EMPLOYEES_VIEW);

  if (!authorization.authorized) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const role = searchParams.get("role");
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");
  const sort = searchParams.get("sort");

  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);
  if (role) query.set("role", role);
  if (search) query.set("search", search);
  if (isActive !== null && isActive !== "") query.set("isActive", isActive);
  if (sort) query.set("sort", sort);

  try {
    const response = await serverApiGet<EmployeesPaginatedResponse>(
      `/employees${query.toString() ? `?${query.toString()}` : ""}` as `/${string}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText || "Backend error", errors: error.errors },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees from backend service" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const authorization = assertSessionPermission(session, PERMISSIONS.EMPLOYEES_CREATE);

  if (!authorization.authorized) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createEmployeeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: "Validation error", errors: parseResult.error.flatten() },
      { status: 422 }
    );
  }

  const validatedData = parseResult.data;

  // Validate mutation security rules
  const validation = validateEmployeeMutation({
    actingUser: session!.user,
    newRole: validatedData.role,
    newPermissions: validatedData.permissions,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.message },
      { status: validation.statusCode || 403 }
    );
  }

  try {
    const response = await serverApiPost<SingleEmployeeResponse>(
      "/employees",
      validatedData
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText, message: error.messageText, errors: error.errors },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create employee in backend service" },
      { status: 502 }
    );
  }
}
