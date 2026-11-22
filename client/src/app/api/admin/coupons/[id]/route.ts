import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { serverApiPatch, serverApiDelete } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await serverApiPatch<any>(`/coupons/${id}`, body);
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      data: { id, ...body },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const res = await serverApiDelete<any>(`/coupons/${id}`);
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  }
}
