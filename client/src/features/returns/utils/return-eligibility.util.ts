/**
 * Centralized Return Eligibility Policies
 *
 * Distinguishes between Customer return eligibility and Admin return creation eligibility.
 *
 * CRITICAL BUSINESS RULES:
 * 1. Customer: Prohibited from requesting a return when order.status === "DELIVERED".
 * 2. Backend contract: Currently accepts return requests only when order.status === "DELIVERED"
 *    (in return.service.js: `if (order.status !== OrderStatuses.DELIVERED) throw ApiError.badRequest(...)`).
 * 3. Therefore, no order status currently satisfies both customer restrictions and backend acceptance
 *    until backend business rules are updated.
 * 4. Admin: Can create returns for customer orders that the backend actually permits (DELIVERED).
 */

export interface EligibilityResult {
  eligible: boolean;
  reason?:
    | "ORDER_DELIVERED_RESTRICTED"
    | "BACKEND_INELIGIBLE_STATUS"
    | "AUTHENTICATION_REQUIRED"
    | "ORDER_NOT_OWNED"
    | "UNKNOWN_STATUS"
    | "UNAUTHORIZED_ROLE";
  messageEn?: string;
  messageAr?: string;
}

export const KNOWN_ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "CUSTOMER_NOT_RESPONDING",
  "FAILED_DELIVERY",
] as const;

export type KnownOrderStatus = (typeof KNOWN_ORDER_STATUSES)[number];

export interface MinimalOrderForEligibility {
  status: string;
  customer?: string | { _id: string; id?: string } | null;
  customerId?: string | null;
}

/**
 * Backend-supported statuses for return request creation.
 * Under server/src/services/return.service.js line 27:
 * `if (order.status !== OrderStatuses.DELIVERED) throw ApiError.badRequest('Can only request returns for DELIVERED orders');`
 */
export const BACKEND_ALLOWED_RETURN_STATUSES: readonly string[] = ["DELIVERED"];

/**
 * Evaluates whether an authenticated customer is eligible to request a return for an order.
 *
 * Rules:
 * 1. Must be authenticated.
 * 2. Order must belong to the customer (if ownership check is requested).
 * 3. Status must NOT be DELIVERED (the core customer restriction).
 * 4. Status must be explicitly supported by backend return creation.
 * 5. Unknown statuses are ineligible.
 */
export function canCustomerRequestReturn(
  order: MinimalOrderForEligibility | null | undefined,
  currentUserId?: string | null
): EligibilityResult {
  if (!order || !order.status) {
    return {
      eligible: false,
      reason: "UNKNOWN_STATUS",
      messageEn: "Unknown or invalid order status.",
      messageAr: "حالة الطلب غير صالحة أو غير معروفة.",
    };
  }

  const normalizedStatus = order.status.toUpperCase();

  // Authentication check
  if (currentUserId === null) {
    return {
      eligible: false,
      reason: "AUTHENTICATION_REQUIRED",
      messageEn: "Authentication required to request a return.",
      messageAr: "يجب تسجيل الدخول لتقديم طلب إرجاع.",
    };
  }

  // Ownership verification when customer identity is specified
  if (currentUserId !== undefined) {
    if (!currentUserId) {
      return {
        eligible: false,
        reason: "AUTHENTICATION_REQUIRED",
        messageEn: "Authentication required to request a return.",
        messageAr: "يجب تسجيل الدخول لتقديم طلب إرجاع.",
      };
    }

    const orderCustomerId =
      typeof order.customer === "string"
        ? order.customer
        : order.customer?._id || order.customer?.id || order.customerId;

    if (!orderCustomerId || String(orderCustomerId) !== String(currentUserId)) {
      return {
        eligible: false,
        reason: "ORDER_NOT_OWNED",
        messageEn: "Order does not belong to the current customer.",
        messageAr: "الطلب غير تابع لحساب العميل الحالي.",
      };
    }
  }

  // CORE RULE: When status is DELIVERED, customer is strictly restricted
  if (normalizedStatus === "DELIVERED") {
    return {
      eligible: false,
      reason: "ORDER_DELIVERED_RESTRICTED",
      messageEn: "Return requests are unavailable for this order.",
      messageAr: "طلب الاسترجاع غير متاح لهذا الطلب.",
    };
  }

  // Check known statuses
  if (!KNOWN_ORDER_STATUSES.includes(normalizedStatus as KnownOrderStatus)) {
    return {
      eligible: false,
      reason: "UNKNOWN_STATUS",
      messageEn: "Unknown order status is ineligible for return.",
      messageAr: "حالة الطلب غير معروفة وغير مؤهلة للإرجاع.",
    };
  }

  // Backend compatibility check:
  // Backend currently requires DELIVERED. Since DELIVERED is prohibited for customer,
  // and no other status is accepted by backend POST /returns/request, this order is ineligible.
  if (!BACKEND_ALLOWED_RETURN_STATUSES.includes(normalizedStatus)) {
    return {
      eligible: false,
      reason: "BACKEND_INELIGIBLE_STATUS",
      messageEn: "Return requests are currently unavailable for this order status.",
      messageAr: "طلب الاسترجاع غير متاح لحالة هذا الطلب حالياً.",
    };
  }

  return { eligible: true };
}

/**
 * Evaluates whether an authorized Admin or Staff user can create a return on behalf of a customer.
 *
 * Rules:
 * 1. User must hold an authorized staff role (SUPER_ADMIN, ADMIN, ORDER_MANAGER, CUSTOMER_SUPPORT).
 * 2. Order status must be permitted by the backend for return processing (currently DELIVERED).
 */
export function canAdminCreateReturn(
  order: MinimalOrderForEligibility | null | undefined,
  userRole?: string | null
): EligibilityResult {
  if (!order || !order.status) {
    return {
      eligible: false,
      reason: "UNKNOWN_STATUS",
      messageEn: "Unknown or invalid order status.",
      messageAr: "حالة الطلب غير صالحة أو غير معروفة.",
    };
  }

  const authorizedRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "ORDER_MANAGER",
    "CUSTOMER_SUPPORT",
  ];

  if (userRole !== undefined) {
    if (!userRole || !authorizedRoles.includes(userRole)) {
      return {
        eligible: false,
        reason: "UNAUTHORIZED_ROLE",
        messageEn: "Staff authorization required to create returns.",
        messageAr: "غير مصرح لك بإنشاء طلبات إرجاع.",
      };
    }
  }

  const normalizedStatus = order.status.toUpperCase();

  // Backend requires DELIVERED for creating a return request
  if (!BACKEND_ALLOWED_RETURN_STATUSES.includes(normalizedStatus)) {
    return {
      eligible: false,
      reason: "BACKEND_INELIGIBLE_STATUS",
      messageEn: `Backend policy requires status DELIVERED. Current status is ${normalizedStatus}.`,
      messageAr: `تقبل سياسة النظام المرتجعات فقط للطلبات المستلمة (DELIVERED). الحالة الحالية: ${normalizedStatus}.`,
    };
  }

  return { eligible: true };
}
