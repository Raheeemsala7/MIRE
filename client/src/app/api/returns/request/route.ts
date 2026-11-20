import { serverApiPost } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";
import { requestReturnSchema } from "@/features/returns/schemas/return.schema";
import type { SingleReturnResponse } from "@/features/returns/types/return.types";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
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

  const parseResult = requestReturnSchema.safeParse(body);
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
      "/returns/request",
      parseResult.data
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.messageText || "Failed to submit return request",
          errors: error.errors,
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to submit return request" },
      { status: 502 }
    );
  }
}
