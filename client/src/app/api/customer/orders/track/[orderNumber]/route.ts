import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api/v1";

interface TrackRouteProps {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(request: NextRequest, { params }: TrackRouteProps) {
  const { orderNumber } = await params;

  if (!orderNumber) {
    return NextResponse.json(
      { success: false, error: "Order number is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/orders/track/${encodeURIComponent(orderNumber)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok) {
      return NextResponse.json(data);
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    // If backend is unreachable, return not found so client can check localStorage
    return NextResponse.json(
      { success: false, message: "Could not connect to tracking service" },
      { status: 404 }
    );
  }
}
