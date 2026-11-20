import { serverApiGet } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { BackendApiError } from "@/lib/auth/backend-client";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // When customer calls /orders?status=DELIVERED, backend restricts to their own orders
    const response = await serverApiGet<{
      success: boolean;
      data: Array<{
        _id: string;
        orderNumber: string;
        status: string;
        createdAt: string;
        items: Array<{
          product: string;
          name: string;
          sku: string;
          color: string;
          size: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
        }>;
        pricing: {
          subtotal: number;
          shippingFee: number;
          totalAmount: number;
        };
      }>;
      total: number;
    }>("/orders?status=DELIVERED&limit=50");

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.messageText || "Failed to fetch delivered orders",
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch delivered orders" },
      { status: 502 }
    );
  }
}
