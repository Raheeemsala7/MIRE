import "server-only";

import { auth } from "@/auth";
import { apiUrl } from "@/lib/auth/backend-client";
import type { OrderDisplay } from "../types/order";

/**
 * Fetch authenticated customer's real orders on the server
 */
export async function getCustomerOrders(): Promise<OrderDisplay[]> {
  const session = await auth();
  const token = (session as any)?.accessToken;

  if (!token) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl()}/orders?limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (error) {
    console.error("getCustomerOrders server fetch error:", error);
  }

  return [];
}

/**
 * Public shipment tracking by orderNumber
 */
export async function trackPublicOrder(orderNumber: string): Promise<OrderDisplay | null> {
  const cleanNumber = orderNumber.trim();
  if (!cleanNumber) return null;

  try {
    const res = await fetch(`${apiUrl()}/orders/track/${encodeURIComponent(cleanNumber)}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      return json?.data || null;
    }
  } catch (error) {
    console.error("trackPublicOrder server fetch error:", error);
  }

  return null;
}
