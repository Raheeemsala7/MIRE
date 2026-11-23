import { serverApiGet, handleApiError } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import { canCustomerRequestReturn } from "@/features/returns/utils/return-eligibility.util";

export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Fetch customer's own orders from backend
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
    }>("/orders?limit=50");

    // Filter strictly using centralized customer eligibility policy:
    // Requires non-DELIVERED status, customer ownership, and explicit backend acceptance.
    const eligibleOrders = (response?.data || []).filter((order) => {
      const eligibility = canCustomerRequestReturn(order, session.user.id);
      return eligibility.eligible;
    });

    return NextResponse.json({
      success: true,
      data: eligibleOrders,
      total: eligibleOrders.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
