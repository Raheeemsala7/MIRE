import { describe, it, expect } from "vitest";
import {
  canCustomerRequestReturn,
  canAdminCreateReturn,
} from "../utils/return-eligibility.util";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS, PERMISSION_BACKEND_MAP } from "@/config/rbac.config";
import { requestReturnSchema } from "../schemas/return.schema";
import { RETURN_REASONS, REFUND_METHODS } from "../types/return.types";

describe("Customer Return Eligibility — DELIVERED Order Restrictions", () => {
  const customerId = "cust-user-123";
  const otherCustomerId = "cust-user-999";

  it("1. DELIVERED order is strictly ineligible for customer return", () => {
    const order = {
      status: "DELIVERED",
      customer: customerId,
    };

    const result = canCustomerRequestReturn(order, customerId);

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("ORDER_DELIVERED_RESTRICTED");
    expect(result.messageEn).toBe("Return requests are unavailable for this order.");
    expect(result.messageAr).toBe("طلب الاسترجاع غير متاح لهذا الطلب.");
  });

  it("2. DELIVERED orders are excluded from customer return selector filter", () => {
    const customerOrders = [
      { _id: "ord-1", status: "DELIVERED" },
      { _id: "ord-2", status: "PROCESSING" },
      { _id: "ord-3", status: "SHIPPED" },
      { _id: "ord-4", status: "DELIVERED" },
    ];

    const selectableOrders = customerOrders.filter((order) => {
      const eligibility = canCustomerRequestReturn(order, customerId);
      return eligibility.eligible;
    });

    // None should be eligible because DELIVERED is prohibited for customer,
    // and non-delivered are not yet supported by backend.
    expect(selectableOrders).toHaveLength(0);
    expect(selectableOrders.some((o) => o.status === "DELIVERED")).toBe(false);
  });

  it("3. Unauthenticated requests are rejected", () => {
    const order = { status: "DELIVERED", customer: customerId };
    const result = canCustomerRequestReturn(order, null);

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("AUTHENTICATION_REQUIRED");
  });

  it("4. Customer cannot request return for another customer's order", () => {
    const order = {
      status: "SHIPPED",
      customer: otherCustomerId,
    };

    const result = canCustomerRequestReturn(order, customerId);

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("ORDER_NOT_OWNED");
  });

  it("5. Unknown or missing statuses are treated as ineligible", () => {
    expect(canCustomerRequestReturn({ status: "" }, customerId).eligible).toBe(false);
    expect(canCustomerRequestReturn({ status: "UNKNOWN_STATE" }, customerId).eligible).toBe(false);
    expect(canCustomerRequestReturn(null, customerId).eligible).toBe(false);
    expect(canCustomerRequestReturn(undefined, customerId).eligible).toBe(false);
  });

  it("6. Non-delivered statuses fail backend eligibility check under current backend contract", () => {
    const nonDeliveredStatuses = ["NEW", "CONFIRMED", "PROCESSING", "READY_TO_SHIP", "SHIPPED"];

    for (const status of nonDeliveredStatuses) {
      const result = canCustomerRequestReturn({ status, customer: customerId }, customerId);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("BACKEND_INELIGIBLE_STATUS");
    }
  });

  it("7. Transitioning an order to DELIVERED causes return eligibility to be immediately revoked", () => {
    const mutableOrder = {
      status: "SHIPPED",
      customer: customerId,
    };

    // Before delivery
    const preDeliveryResult = canCustomerRequestReturn(mutableOrder, customerId);
    expect(preDeliveryResult.reason).not.toBe("ORDER_DELIVERED_RESTRICTED");

    // Order transitions to DELIVERED
    mutableOrder.status = "DELIVERED";
    const postDeliveryResult = canCustomerRequestReturn(mutableOrder, customerId);
    expect(postDeliveryResult.eligible).toBe(false);
    expect(postDeliveryResult.reason).toBe("ORDER_DELIVERED_RESTRICTED");
  });

  it("8. Stale customer request targeting DELIVERED order is rejected", () => {
    const stalePayload = {
      originalOrderId: "ord-delivered-01",
      items: [
        {
          productId: "prod-1",
          sku: "SKU-RED-M",
          color: "Red",
          size: "M",
          quantity: 1,
          unitPrice: 250,
        },
      ],
      reason: RETURN_REASONS.SIZE_TOO_SMALL,
      refundMethod: REFUND_METHODS.CASH,
    };

    const validation = requestReturnSchema.safeParse(stalePayload);
    expect(validation.success).toBe(true);

    // But eligibility verification for DELIVERED order fails:
    const eligibility = canCustomerRequestReturn(
      { status: "DELIVERED", customer: customerId },
      customerId
    );
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toBe("ORDER_DELIVERED_RESTRICTED");
  });

  it("9. Order with null/missing customer (guest order) cannot be claimed by customer", () => {
    const guestOrder = {
      status: "SHIPPED",
      customer: null,
    };

    const result = canCustomerRequestReturn(guestOrder, customerId);

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("ORDER_NOT_OWNED");
    expect(result.messageEn).toBe("Order does not belong to the current customer.");
  });

  it("10. Customer ownership check properly resolves populated customer object", () => {
    const ownedOrder = {
      status: "SHIPPED",
      customer: { _id: customerId, id: customerId },
    };

    const result = canCustomerRequestReturn(ownedOrder, customerId);

    // Passed ownership, but fails backend status under current contract
    expect(result.reason).toBe("BACKEND_INELIGIBLE_STATUS");

    const foreignOrder = {
      status: "SHIPPED",
      customer: { _id: otherCustomerId, id: otherCustomerId },
    };

    const foreignResult = canCustomerRequestReturn(foreignOrder, customerId);
    expect(foreignResult.eligible).toBe(false);
    expect(foreignResult.reason).toBe("ORDER_NOT_OWNED");
  });
});

describe("Admin Return Creation & Authorization", () => {
  it("1. Authorized Admin and Staff roles have permission to create returns", () => {
    const authorizedRoles = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT"] as const;

    for (const role of authorizedRoles) {
      const isAuthorized = can(role, PERMISSIONS.RETURNS_CREATE, ["returns:write"]);
      expect(isAuthorized).toBe(true);
    }
  });

  it("2. Unauthorized roles cannot create returns", () => {
    const unauthorizedRoles = ["CUSTOMER", "INVENTORY_MANAGER", "ACCOUNTANT"] as const;

    for (const role of unauthorizedRoles) {
      const isAuthorized = can(role, PERMISSIONS.RETURNS_CREATE, ["returns:write"]);
      expect(isAuthorized).toBe(false);
    }
  });

  it("3. Admin return creation requires backend-supported status (DELIVERED)", () => {
    const deliveredOrder = { status: "DELIVERED" };
    const adminResult = canAdminCreateReturn(deliveredOrder, "ADMIN");
    expect(adminResult.eligible).toBe(true);

    const nonDeliveredOrder = { status: "PROCESSING" };
    const invalidResult = canAdminCreateReturn(nonDeliveredOrder, "ADMIN");
    expect(invalidResult.eligible).toBe(false);
    expect(invalidResult.reason).toBe("BACKEND_INELIGIBLE_STATUS");
  });

  it("4. Unauthorized staff cannot create return even for DELIVERED order", () => {
    const deliveredOrder = { status: "DELIVERED" };
    const result = canAdminCreateReturn(deliveredOrder, "INVENTORY_MANAGER");
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("UNAUTHORIZED_ROLE");
  });

  it("5. Permission backend map links RETURNS_CREATE to returns:write", () => {
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.RETURNS_CREATE]).toBe("returns:write");
  });

  it("6. canAdminCreateReturn rejects null/unauthorized role when provided", () => {
    const deliveredOrder = { status: "DELIVERED" };
    expect(canAdminCreateReturn(deliveredOrder, null).eligible).toBe(false);
    expect(canAdminCreateReturn(deliveredOrder, "CUSTOMER").eligible).toBe(false);
    expect(canAdminCreateReturn(deliveredOrder, "ACCOUNTANT").eligible).toBe(false);
  });

  it("7. canAdminCreateReturn allows CUSTOMER_SUPPORT and ORDER_MANAGER for DELIVERED orders", () => {
    const deliveredOrder = { status: "DELIVERED" };
    expect(canAdminCreateReturn(deliveredOrder, "CUSTOMER_SUPPORT").eligible).toBe(true);
    expect(canAdminCreateReturn(deliveredOrder, "ORDER_MANAGER").eligible).toBe(true);
  });
});

describe("Admin Return Item Quantity & Boundary Validation", () => {
  const orderData = {
    orderNumber: "ORD-2026-0042",
    status: "DELIVERED",
    items: [
      { sku: "SKU-A", name: "Abaya Classic", quantity: 2, unitPrice: 1200 },
      { sku: "SKU-B", name: "Silk Hijab", quantity: 1, unitPrice: 350 },
    ],
  };

  function validateReturnQuantities(
    order: typeof orderData,
    returnItems: Array<{ sku: string; quantity: number }>
  ) {
    for (const returnItem of returnItems) {
      const orderItem = order.items.find((oi) => oi.sku === returnItem.sku);
      if (!orderItem) {
        throw new Error(`Item with SKU ${returnItem.sku} was not part of order ${order.orderNumber}`);
      }
      if (returnItem.quantity > orderItem.quantity) {
        throw new Error(
          `Requested return quantity (${returnItem.quantity}) exceeds ordered quantity (${orderItem.quantity}) for ${orderItem.name}`
        );
      }
    }
    return true;
  }

  it("1. Accepts return items matching ordered SKUs and quantities", () => {
    const validItems = [{ sku: "SKU-A", quantity: 2 }, { sku: "SKU-B", quantity: 1 }];
    expect(validateReturnQuantities(orderData, validItems)).toBe(true);
  });

  it("2. Rejects return item with SKU not in original order", () => {
    const foreignSkuItems = [{ sku: "SKU-UNKNOWN", quantity: 1 }];
    expect(() => validateReturnQuantities(orderData, foreignSkuItems)).toThrow(
      "Item with SKU SKU-UNKNOWN was not part of order ORD-2026-0042"
    );
  });

  it("3. Rejects return quantity exceeding ordered quantity", () => {
    const excessiveItems = [{ sku: "SKU-B", quantity: 2 }]; // only 1 was ordered
    expect(() => validateReturnQuantities(orderData, excessiveItems)).toThrow(
      "Requested return quantity (2) exceeds ordered quantity (1) for Silk Hijab"
    );
  });
});

describe("Return Request Schema & Validation", () => {
  const validPayload = {
    originalOrderId: "ord-555",
    items: [
      {
        productId: "prod-abc",
        sku: "SKU-BLK-L",
        color: "Black",
        size: "L",
        quantity: 2,
        unitPrice: 1500,
      },
    ],
    reason: RETURN_REASONS.SIZE_TOO_LARGE,
    reasonDetails: "Customer requested a smaller size instead.",
    refundMethod: REFUND_METHODS.CASH,
  };

  it("1. Validates standard return payload correctly", () => {
    const parsed = requestReturnSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("2. Rejects payloads with empty items array", () => {
    const parsed = requestReturnSchema.safeParse({
      ...validPayload,
      items: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("3. Rejects negative or zero quantities", () => {
    const parsedZero = requestReturnSchema.safeParse({
      ...validPayload,
      items: [{ ...validPayload.items[0], quantity: 0 }],
    });
    expect(parsedZero.success).toBe(false);

    const parsedNegative = requestReturnSchema.safeParse({
      ...validPayload,
      items: [{ ...validPayload.items[0], quantity: -1 }],
    });
    expect(parsedNegative.success).toBe(false);
  });

  it("4. Rejects invalid return reason enum", () => {
    const parsed = requestReturnSchema.safeParse({
      ...validPayload,
      reason: "NOT_A_VALID_REASON",
    });
    expect(parsed.success).toBe(false);
  });

  it("5. Rejects invalid refund method", () => {
    const parsed = requestReturnSchema.safeParse({
      ...validPayload,
      refundMethod: "CRYPTO",
    });
    expect(parsed.success).toBe(false);
  });
});
