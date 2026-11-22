import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";

export async function GET() {
  const session = await getServerSession();

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
    return handleApiError(error);
  }
}
