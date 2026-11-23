"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/auth";
import { serverApiPost, serverApiPatch, serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  canCustomerRequestReturn,
  canAdminCreateReturn,
} from "../utils/return-eligibility.util";
import {
  requestReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  logCallAttemptSchema,
  assignReturnSchema,
} from "../schemas/return.schema";
import type {
  RequestReturnPayload,
  UpdateReturnStatusPayload,
  InspectReturnPayload,
  LogCallAttemptPayload,
  AssignReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";
import type { OrderDoc } from "@/features/admin/orders/types/order-admin.types";

/**
 * Customer Return Request Submission (with strict server-side protection against DELIVERED orders)
 */
export async function submitReturnRequestAction(
  payload: RequestReturnPayload
): Promise<SingleReturnResponse> {
  // 1. Authorization & Session Check
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Authentication required");
  }

  // 2. Validation
  const parseResult = requestReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // 3. Server-side Order Verification
  let orderData: {
    status: string;
    customer?: string | { _id: string; id?: string } | null;
    customerId?: string | null;
  } | null = null;

  try {
    const orderRes = await serverApiGet<{
      success: boolean;
      data: {
        status: string;
        customer?: string | { _id: string; id?: string } | null;
        customerId?: string | null;
      };
    }>(`/orders/${encodeURIComponent(parseResult.data.originalOrderId)}` as `/${string}`);
    orderData = orderRes?.data || (orderRes as unknown as typeof orderData);
  } catch {
    throw new Error("Target order could not be found or verified on backend");
  }

  // 4. Verify Customer Ownership
  const orderCustomerId =
    typeof orderData?.customer === "string"
      ? orderData.customer
      : orderData?.customer?._id || orderData?.customer?.id || orderData?.customerId;

  if (session.user.role === "CUSTOMER") {
    if (!orderCustomerId || String(orderCustomerId) !== String(session.user.id)) {
      throw new Error("Unauthorized: You can only request returns for your own orders");
    }
  }

  // 5. Customer Eligibility Check: Prohibits DELIVERED orders and checks backend readiness
  const customerEligibility = canCustomerRequestReturn(orderData, session.user.id);
  if (!customerEligibility.eligible) {
    throw new Error(
      customerEligibility.messageEn || "Return requests are unavailable for this order."
    );
  }

  // 6. Execution
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      "/returns/request",
      parseResult.data
    );

    revalidatePath("/[locale]/account/returns", "page");
    revalidatePath("/[locale]/orders", "page");

    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to submit return request");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to submit return request in backend service");
  }
}

/**
 * Admin Return Creation on behalf of a customer
 */
export async function adminCreateReturnAction(
  payload: RequestReturnPayload
): Promise<SingleReturnResponse> {
  // 1. Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_CREATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized to create return requests");
  }

  // 2. Validation
  const parseResult = requestReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // 3. Server-side Order Verification
  let orderData: {
    _id?: string;
    orderNumber?: string;
    status: string;
    customer?: string | { _id: string; id?: string } | null;
    items?: Array<{
      sku: string;
      name?: string;
      quantity: number;
      unitPrice: number;
    }>;
  } | null = null;

  try {
    const orderRes = await serverApiGet<{
      success: boolean;
      data: {
        _id?: string;
        orderNumber?: string;
        status: string;
        customer?: string | { _id: string; id?: string } | null;
        items?: Array<{
          sku: string;
          name?: string;
          quantity: number;
          unitPrice: number;
        }>;
      };
    }>(`/orders/${encodeURIComponent(parseResult.data.originalOrderId)}` as `/${string}`);
    orderData = orderRes?.data || (orderRes as unknown as typeof orderData);
  } catch {
    throw new Error("Target order could not be found or verified on backend");
  }

  // 4. Verify Admin Eligibility under Backend Rules
  const adminEligibility = canAdminCreateReturn(orderData, session?.user?.role);
  if (!adminEligibility.eligible) {
    throw new Error(
      adminEligibility.messageEn || "Order is not eligible for return creation under backend rules"
    );
  }

  // 5. Verify quantities do not exceed original order items
  if (Array.isArray(orderData?.items)) {
    for (const returnItem of parseResult.data.items) {
      const orderItem = orderData.items.find((oi) => oi.sku === returnItem.sku);
      if (!orderItem) {
        throw new Error(
          `Item with SKU ${returnItem.sku} was not part of order ${orderData.orderNumber || ""}`
        );
      }
      if (returnItem.quantity > orderItem.quantity) {
        throw new Error(
          `Requested return quantity (${returnItem.quantity}) exceeds ordered quantity (${orderItem.quantity}) for ${orderItem.name || returnItem.sku}`
        );
      }
    }
  }

  // 6. Submit to Backend
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      "/returns/request",
      parseResult.data
    );

    // 7. Revalidate Caches
    const createdReturnId = (response as { data?: { _id?: string } })?.data?._id;
    revalidatePath("/[locale]/admin/returns", "page");
    revalidatePath("/[locale]/admin/returns/new", "page");
    if (createdReturnId) {
      revalidatePath(`/[locale]/admin/returns/${createdReturnId}`, "page");
      revalidatePath(`/[locale]/account/returns/${createdReturnId}`, "page");
    }
    revalidatePath(`/[locale]/admin/orders/${parseResult.data.originalOrderId}`, "page");
    revalidatePath("/[locale]/orders", "page");
    revalidatePath("/[locale]/account/returns", "page");

    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to create return request");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to create return request in backend service");
  }
}

/**
 * Interactive server-side order search for Admin Return Creation.
 * Reuses existing backend GET /orders with search query and status=DELIVERED filter.
 */
export async function searchAdminOrdersForReturnAction(
  query: string
): Promise<{ success: boolean; data: OrderDoc[]; error?: string }> {
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_CREATE
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized to search orders for return creation");
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { success: true, data: [] };
  }

  try {
    const response = await serverApiGet<{
      success: boolean;
      data: OrderDoc[];
    }>(`/orders?status=DELIVERED&search=${encodeURIComponent(cleanQuery)}&limit=20` as `/${string}`);

    return {
      success: true,
      data: Array.isArray(response?.data) ? response.data : [],
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to search orders",
    };
  }
}

export async function updateReturnStatusAction(
  id: string,
  payload: UpdateReturnStatusPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_UPDATE_STATUS
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = updateReturnStatusSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPatch<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/status` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to update return status");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to update return status in backend service");
  }
}

export async function inspectReturnAction(
  id: string,
  payload: InspectReturnPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_INSPECT
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = inspectReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/inspect` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to inspect return");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to inspect return in backend service");
  }
}

export async function logCallAttemptAction(
  id: string,
  payload: LogCallAttemptPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_LOG_CALL
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = logCallAttemptSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPost<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/call-attempt` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to log call attempt");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to log call attempt in backend service");
  }
}

export async function assignReturnAction(
  id: string,
  payload: AssignReturnPayload
): Promise<SingleReturnResponse> {
  // Authorization
  const session = await getServerSession();
  const authorization = assertSessionPermission(
    session,
    PERMISSIONS.RETURNS_ASSIGN
  );

  if (!authorization.authorized) {
    throw new Error(authorization.error || "Unauthorized");
  }

  if (!id) {
    throw new Error("Return ID is required");
  }

  // Validation
  const parseResult = assignReturnSchema.safeParse(payload);
  if (!parseResult.success) {
    const errorDetails = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    throw new Error(`Validation error: ${errorDetails}`);
  }

  // Execution
  try {
    const response = await serverApiPatch<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}/assign` as `/${string}`,
      parseResult.data
    );
    return response;
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new Error(error.messageText || "Failed to assign return");
    }
    if (error instanceof Error) throw error;
    throw new Error("Failed to assign return in backend service");
  }
}
