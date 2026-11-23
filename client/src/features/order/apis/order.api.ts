import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import type { OrderDisplay } from "../types/order";

export async function getOrdersApi({
  page = 1,
  limit = 50,
  userId,
}: { page?: number; limit?: number; userId?: string } = {}): Promise<OrderDisplay[]> {
  const token = await getNextAuthToken();
  if (!token?.token) return [];

  try {
    const userFilter = userId ? `&user=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${API_URL}/orders?page=${page}&limit=${limit}${userFilter}`, {
      method: "GET",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("getOrdersApi error:", error);
    return [];
  }
}

export async function getCustomerOrderByIdApi(id: string): Promise<OrderDisplay | null> {
  const cleanId = id.trim();
  if (!cleanId) return null;

  const token = await getNextAuthToken();
  if (!token?.token) return null;

  try {
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(cleanId)}`, {
      method: "GET",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("getCustomerOrderByIdApi error:", error);
    return null;
  }
}

export async function trackOrderApi(orderNumber: string): Promise<OrderDisplay | null> {
  const cleanNumber = orderNumber.trim();
  if (!cleanNumber) return null;

  const token = await getNextAuthToken();
  const authHeaders = token?.token ? HEADERS.authorize(token.token) : {};

  try {
    const res = await fetch(`${API_URL}/orders/track/${encodeURIComponent(cleanNumber)}`, {
      method: "GET",
      headers: {
        ...HEADERS.JsonBody,
        ...authHeaders,
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok && data?.success && data?.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("trackOrderApi error:", error);
    return null;
  }
}
