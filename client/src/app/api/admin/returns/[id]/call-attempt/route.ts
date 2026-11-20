import { serverApiPost } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { logCallAttemptSchema } from "@/features/returns/schemas/return.schema";
import type { SingleReturnResponse } from "@/features/returns/types/return.types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_LOG_CALL
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parseResult = logCallAttemptSchema.safeParse(body);
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

  try {
    const response = await serverApiPost<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/call-attempt` as `/${string}`,
      parseResult.data
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.messageText || "Failed to log call attempt",
          errors: error.errors,
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to record customer call attempt" },
      { status: 502 }
    );
  }
}
