import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
import type { OrderDoc, OrdersPaginatedResponse } from "../types/order-admin.types";

export async function getAdminOrdersApi(
  queryString: string = ""
): Promise<{ orders: OrderDoc[]; total: number }> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    return { orders: [], total: 0 };
  }

  try {
    const url = `${API_URL}/orders${queryString ? `?${queryString}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      cache: "no-store",
    });

    const data: OrdersPaginatedResponse = await res.json();
    if (res.ok && data?.success && Array.isArray(data.data)) {
      return {
        orders: data.data,
        total: data.total ?? data.data.length,
      };
    }
    return { orders: [], total: 0 };
  } catch (error) {
    console.error("getAdminOrdersApi error:", error);
    return { orders: [], total: 0 };
  }
}

export async function getAdminOrderByIdApi(id: string): Promise<OrderDoc | null> {
  const token = await getNextAuthToken();
  if (!token?.token) return null;

  try {
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.token),
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (res.ok && data?.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("getAdminOrderByIdApi error:", error);
    return null;
  }
}
