import type { OrderDisplay } from "../types/order";

/**
 * Validates whether an order belongs to the given user or customer ID.
 * Returns true if the order belongs to the user, or if the user is an Admin/SuperAdmin.
 */
export function isOrderOwnedByUser(
  order: (OrderDisplay & { [key: string]: any }) | null | undefined,
  userId: string | undefined | null,
  role?: string
): boolean {
  if (!order || !userId) return false;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;

  const orderUserId =
    typeof order.user === "string"
      ? order.user
      : order.user?._id || order.user?.id || order.userId;

  const orderCustomerId =
    typeof order.customer === "string"
      ? order.customer
      : order.customer?._id || order.customer?.id || order.customerId;

  // Direct user ID match
  if (orderUserId && String(orderUserId) === String(userId)) {
    return true;
  }

  // Customer document ID match
  if (orderCustomerId && String(orderCustomerId) === String(userId)) {
    return true;
  }

  // Nested customer.user match
  if (
    typeof order.customer === "object" &&
    order.customer &&
    "user" in order.customer &&
    String((order.customer as any).user) === String(userId)
  ) {
    return true;
  }

  return false;
}
