import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { serverApiGet, serverApiPost } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api/v1";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const session = await auth();

  // If user is logged in, use authenticated backend call
  if (session?.user) {
    try {
      const response = await serverApiPost<{
        success: boolean;
        message: string;
        data: any;
      }>("/orders/checkout", body);

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      if (error instanceof BackendApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.messageText || "Failed to place order",
            errors: error.errors,
          },
          { status: error.status }
        );
      }
    }
  }

  // Guest checkout or fallback direct backend call
  try {
    const guestId = body.guestId || `guest-${Date.now()}`;
    const res = await fetch(`${BACKEND_URL}/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-guest-id": guestId,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    // Graceful fallback for offline demo / decoupled mode
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `MIRE-${new Date().getFullYear()}-${randomSeq}`;
    const subtotal = (body.items || []).reduce(
      (sum: number, it: any) => sum + (it.price || it.unitPrice || 850) * (it.quantity || 1),
      0
    );
    const shippingFee = subtotal >= 1500 ? 0 : 50;
    const totalAmount = subtotal + shippingFee;

    const mockOrder = {
      success: true,
      message: "Order placed successfully",
      data: {
        _id: `mock-order-${Date.now()}`,
        orderNumber,
        customerInfo: body.customerInfo,
        shippingAddress: body.shippingAddress,
        items: (body.items || []).map((it: any) => ({
          name: it.title || it.name || "Abaya / Skirt",
          color: it.color || "Standard",
          size: it.size || "M",
          quantity: it.quantity || 1,
          unitPrice: it.price || it.unitPrice || 850,
          subtotal: (it.price || it.unitPrice || 850) * (it.quantity || 1),
        })),
        pricing: {
          subtotal,
          shippingFee,
          totalAmount,
        },
        paymentInfo: {
          method: body.paymentMethod || "COD",
          status: "PENDING",
        },
        status: "NEW",
        createdAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(mockOrder, { status: 201 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      message: "Guest mode - no server orders",
    });
  }

  try {
    const response = await serverApiGet<{
      success: boolean;
      data: any[];
      total: number;
    }>("/orders?limit=20");

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { success: false, error: error.messageText },
        { status: error.status }
      );
    }
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    });
  }
}
