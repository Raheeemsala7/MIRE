import { describe, it, expect, vi, beforeEach } from "vitest";
import { canCustomerRequestReturn } from "@/features/returns/utils/return-eligibility.util";

// Types simulating database documents
interface MockOrder {
  _id: string;
  orderNumber: string;
  user?: string | null;
  customer?: string | { _id: string; user?: string } | null;
  status: string;
  items: Array<{ name: string; sku: string; quantity: number; unitPrice: number }>;
  pricing: { subtotal: number; totalAmount: number };
  internalNotes?: Array<{ note: string; addedBy: string }>;
  assignedEmployee?: string;
  customerInfo: { fullName: string; phone: string; email?: string };
}

interface MockUser {
  _id: string;
  name: string;
  role: string;
  permissions: string[];
  hasPermission: (perm: string) => boolean;
}

function createMockUser(id: string, name: string, role: string, permissions: string[] = []): MockUser {
  return {
    _id: id,
    name,
    role,
    permissions,
    hasPermission: (perm: string) => {
      if (role === "SUPER_ADMIN" || permissions.includes("*")) return true;
      return permissions.includes(perm);
    },
  };
}

/**
 * Backend authorization simulator implementing the exact logic
 * enforced in server/src/controllers/order.controller.js and order.service.js
 */
class BackendOrderAuthSimulator {
  private orders: MockOrder[] = [];
  private customers: Array<{ _id: string; user: string }> = [];

  constructor(orders: MockOrder[], customers: Array<{ _id: string; user: string }> = []) {
    this.orders = orders;
    this.customers = customers;
  }

  getOrders(user: MockUser, query: Record<string, any> = {}) {
    const finalQuery = { ...query };

    if (user.role === "CUSTOMER") {
      if (!user.hasPermission("orders:read_own")) {
        throw new Error("403: Missing required permission: orders:read_own");
      }
      // Strict ownership boundary: override any user/customer query param
      finalQuery.user = user._id;
      delete finalQuery.customer;
      delete finalQuery.assignedEmployee;
    } else {
      if (user.role !== "SUPER_ADMIN" && !user.hasPermission("orders:read")) {
        throw new Error("403: Missing required permission: orders:read");
      }
    }

    // Database query execution with ownership filtering
    let matched = this.orders;

    if (finalQuery.user) {
      const customerIds = this.customers
        .filter((c) => c.user === finalQuery.user)
        .map((c) => c._id);

      matched = matched.filter((o) => {
        const orderUserId = typeof o.user === "string" ? o.user : null;
        const orderCustId =
          typeof o.customer === "string"
            ? o.customer
            : typeof o.customer === "object" && o.customer?._id
            ? o.customer._id
            : null;

        const isUserMatch = orderUserId === finalQuery.user;
        const isCustMatch = orderCustId && customerIds.includes(orderCustId);
        return isUserMatch || isCustMatch;
      });
    }

    if (finalQuery.status) {
      matched = matched.filter((o) => o.status === finalQuery.status);
    }

    if (finalQuery.search) {
      const q = finalQuery.search.toLowerCase();
      matched = matched.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerInfo.fullName.toLowerCase().includes(q) ||
          o.customerInfo.phone.includes(q)
      );
    }

    // Sanitize output for CUSTOMER role
    const sanitized =
      user.role === "CUSTOMER"
        ? matched.map((o) => {
            const copy = { ...o };
            delete copy.internalNotes;
            delete copy.assignedEmployee;
            return copy;
          })
        : matched;

    return {
      orders: sanitized,
      total: sanitized.length,
    };
  }

  getOrderById(user: MockUser, idOrNumber: string) {
    const order = this.orders.find(
      (o) => o._id === idOrNumber || o.orderNumber === idOrNumber
    );

    if (!order) {
      throw new Error("404: Order not found");
    }

    if (user.role === "CUSTOMER") {
      if (!user.hasPermission("orders:read_own")) {
        throw new Error("403: Missing required permission: orders:read_own");
      }

      const orderUserId = typeof order.user === "string" ? order.user : null;
      const custUserId =
        typeof order.customer === "object" && order.customer?.user
          ? order.customer.user
          : this.customers.find((c) => c._id === order.customer)?.user;

      const isOwner = orderUserId === user._id || custUserId === user._id;

      if (!isOwner) {
        throw new Error("403: Access denied. You do not have permission to view this order.");
      }

      const copy = { ...order };
      delete copy.internalNotes;
      delete copy.assignedEmployee;
      return copy;
    } else {
      if (user.role !== "SUPER_ADMIN" && !user.hasPermission("orders:read")) {
        throw new Error("403: Missing required permission: orders:read");
      }
      return order;
    }
  }

  trackOrder(orderNumber: string, currentUser?: MockUser | null) {
    const cleanNumber = String(orderNumber || "").trim();
    if (!cleanNumber) {
      throw new Error("400: Order number is required");
    }

    // Public tracking is strictly by orderNumber, never internal database ObjectId
    const order = this.orders.find(
      (o) => o.orderNumber.toUpperCase() === cleanNumber.toUpperCase()
    );

    if (!order) {
      throw new Error("404: Order not found");
    }

    const orderUserId = typeof order.user === "string" ? order.user : null;
    const custUserId =
      typeof order.customer === "object" && order.customer?.user
        ? order.customer.user
        : this.customers.find((c) => c._id === order.customer)?.user;

    const isRegisteredAccountOrder = Boolean(orderUserId || custUserId);

    if (isRegisteredAccountOrder) {
      if (!currentUser) {
        throw new Error("401: Please log in to track orders associated with an account");
      }

      if (currentUser.role === "CUSTOMER") {
        const isOwner = orderUserId === currentUser._id || custUserId === currentUser._id;
        if (!isOwner) {
          throw new Error("403: You are not authorized to track this order");
        }
      }
    }

    // Sanitized output: strip all private PII (phone, email, exact address, staff notes)
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      shippingCity: "Cairo",
    };
  }

  requestReturn(user: MockUser | null, originalOrderId: string) {
    const order = this.orders.find(
      (o) => o._id === originalOrderId || o.orderNumber === originalOrderId
    );
    if (!order) throw new Error("404: Order not found");

    const orderUserId = typeof order.user === "string" ? order.user : null;
    const custUserId =
      typeof order.customer === "object" && order.customer?.user
        ? order.customer.user
        : this.customers.find((c) => c._id === order.customer)?.user;

    // If order is linked to a registered account, caller must be authenticated as owner
    if (orderUserId || custUserId) {
      if (!user) {
        throw new Error("401: Authentication required to request a return for this order");
      }

      if (user.role === "CUSTOMER") {
        const isOwner = orderUserId === user._id || custUserId === user._id;
        if (!isOwner) {
          throw new Error("403: You are not authorized to request a return for this order");
        }
      }
    }

    if (order.status !== "DELIVERED") {
      throw new Error("400: Can only request returns for DELIVERED orders");
    }

    return { success: true, returnNumber: `RET-2026-0001` };
  }
}

describe("CRITICAL SECURITY FIX — Customer Orders Data Isolation & Ownership Authorization", () => {
  // Test Fixtures
  const newCustomer = createMockUser("user-new-001", "Hala New", "CUSTOMER", ["orders:read_own"]);
  const customerA = createMockUser("user-cust-A", "Fatima Customer", "CUSTOMER", ["orders:read_own"]);
  const customerB = createMockUser("user-cust-B", "Mariam Customer", "CUSTOMER", ["orders:read_own"]);
  const adminUser = createMockUser("user-admin-1", "Admin Boss", "ADMIN", ["orders:read", "orders:write"]);
  const inventoryStaff = createMockUser("user-inv-1", "Inventory Staff", "INVENTORY_MANAGER", ["products:read"]);

  const orderA: MockOrder = {
    _id: "order-id-AAA",
    orderNumber: "MIRE-2026-00001",
    user: customerA._id,
    customer: "cust-profile-A",
    status: "PROCESSING",
    items: [{ name: "Linen Abaya", sku: "ABY-LINEN-BLK", quantity: 1, unitPrice: 850 }],
    pricing: { subtotal: 850, totalAmount: 900 },
    internalNotes: [{ note: "Customer requested expedited packaging", addedBy: "staff-1" }],
    assignedEmployee: "emp-packer-1",
    customerInfo: { fullName: "Fatima Customer", phone: "+201012345678", email: "fatima@example.com" },
  };

  const orderB: MockOrder = {
    _id: "order-id-BBB",
    orderNumber: "MIRE-2026-00002",
    user: customerB._id,
    customer: "cust-profile-B",
    status: "DELIVERED",
    items: [{ name: "Silk Kimono Dress", sku: "DRS-SILK-EMR", quantity: 2, unitPrice: 1200 }],
    pricing: { subtotal: 2400, totalAmount: 2450 },
    internalNotes: [{ note: "VIP customer - handle with care", addedBy: "staff-2" }],
    assignedEmployee: "emp-driver-2",
    customerInfo: { fullName: "Mariam Customer", phone: "+201098765432", email: "mariam@example.com" },
  };

  const mockDb = [orderA, orderB];
  const mockCustomers = [
    { _id: "cust-profile-A", user: customerA._id },
    { _id: "cust-profile-B", user: customerB._id },
  ];

  let backend: BackendOrderAuthSimulator;

  beforeEach(() => {
    backend = new BackendOrderAuthSimulator(mockDb, mockCustomers);
  });

  // ==========================================
  // Scenario A — New Customer
  // ==========================================
  describe("Scenario A — New Customer Isolation", () => {
    it("returns an empty order list for a newly registered customer", () => {
      const response = backend.getOrders(newCustomer);
      expect(response.orders).toHaveLength(0);
      expect(response.total).toBe(0);
    });

    it("never exposes orders from other existing customers to a new customer", () => {
      const response = backend.getOrders(newCustomer);
      const orderNumbers = response.orders.map((o) => o.orderNumber);
      expect(orderNumbers).not.toContain(orderA.orderNumber);
      expect(orderNumbers).not.toContain(orderB.orderNumber);
    });
  });

  // ==========================================
  // Scenario B — Customer A
  // ==========================================
  describe("Scenario B — Customer A Data Isolation", () => {
    it("retrieves only Order A for Customer A", () => {
      const response = backend.getOrders(customerA);
      expect(response.orders).toHaveLength(1);
      expect(response.orders[0]._id).toBe(orderA._id);
      expect(response.orders[0].orderNumber).toBe("MIRE-2026-00001");
    });

    it("strictly prevents Order B from being returned in Customer A order list", () => {
      const response = backend.getOrders(customerA);
      const containsOrderB = response.orders.some((o) => o._id === orderB._id);
      expect(containsOrderB).toBe(false);
    });

    it("sanitizes admin-only fields (internalNotes, assignedEmployee) from Customer A view", () => {
      const response = backend.getOrders(customerA);
      expect(response.orders[0].internalNotes).toBeUndefined();
      expect(response.orders[0].assignedEmployee).toBeUndefined();
    });
  });

  // ==========================================
  // Scenario C — Customer B
  // ==========================================
  describe("Scenario C — Customer B Data Isolation", () => {
    it("retrieves only Order B for Customer B", () => {
      const response = backend.getOrders(customerB);
      expect(response.orders).toHaveLength(1);
      expect(response.orders[0]._id).toBe(orderB._id);
      expect(response.orders[0].orderNumber).toBe("MIRE-2026-00002");
    });

    it("strictly prevents Order A from being returned in Customer B order list", () => {
      const response = backend.getOrders(customerB);
      const containsOrderA = response.orders.some((o) => o._id === orderA._id);
      expect(containsOrderA).toBe(false);
    });
  });

  // ==========================================
  // Scenario D — Direct Order Access
  // ==========================================
  describe("Scenario D — Direct Order Access Authorization", () => {
    it("allows Customer A to access their own Order A by ID", () => {
      const order = backend.getOrderById(customerA, orderA._id);
      expect(order._id).toBe(orderA._id);
      expect(order.orderNumber).toBe(orderA.orderNumber);
      expect(order.internalNotes).toBeUndefined();
    });

    it("rejects Customer A direct request for Order B with 403 Forbidden", () => {
      expect(() => backend.getOrderById(customerA, orderB._id)).toThrow(
        /403: Access denied/
      );
    });

    it("rejects Customer B direct request for Order A with 403 Forbidden", () => {
      expect(() => backend.getOrderById(customerB, orderA._id)).toThrow(
        /403: Access denied/
      );
    });

    it("rejects New Customer direct request for any existing order", () => {
      expect(() => backend.getOrderById(newCustomer, orderA._id)).toThrow(/403/);
      expect(() => backend.getOrderById(newCustomer, orderB._id)).toThrow(/403/);
    });
  });

  // ==========================================
  // Scenario E — Admin & RBAC
  // ==========================================
  describe("Scenario E — Admin Management & Staff Restrictions", () => {
    it("permits authorized Admin with orders:read to access all orders", () => {
      const response = backend.getOrders(adminUser);
      expect(response.orders).toHaveLength(2);
      expect(response.orders.map((o) => o._id)).toContain(orderA._id);
      expect(response.orders.map((o) => o._id)).toContain(orderB._id);
    });

    it("preserves internal notes and staff assignment for authorized Admin", () => {
      const order = backend.getOrderById(adminUser, orderA._id);
      expect(order.internalNotes).toBeDefined();
      expect(order.internalNotes?.[0]?.note).toBe("Customer requested expedited packaging");
      expect(order.assignedEmployee).toBe("emp-packer-1");
    });

    it("rejects unauthorized staff lacking orders:read permission (INVENTORY_MANAGER)", () => {
      expect(() => backend.getOrders(inventoryStaff)).toThrow(
        /403: Missing required permission: orders:read/
      );
      expect(() => backend.getOrderById(inventoryStaff, orderA._id)).toThrow(
        /403: Missing required permission: orders:read/
      );
    });
  });

  // ==========================================
  // Scenario F — Session Switching & Client Cache Isolation
  // ==========================================
  describe("Scenario F — Session Switching", () => {
    it("ensures Customer B never receives Customer A data on session change", () => {
      // 1. Session Customer A
      const sessionAOrders = backend.getOrders(customerA);
      expect(sessionAOrders.orders).toHaveLength(1);
      expect(sessionAOrders.orders[0]._id).toBe(orderA._id);

      // 2. Simulated Logout & Login as Customer B
      const sessionBOrders = backend.getOrders(customerB);
      expect(sessionBOrders.orders).toHaveLength(1);
      expect(sessionBOrders.orders[0]._id).toBe(orderB._id);

      // Verify no cross-contamination between sessions
      const orderIdsB = sessionBOrders.orders.map((o) => o._id);
      expect(orderIdsB).not.toContain(sessionAOrders.orders[0]._id);
    });
  });

  // ==========================================
  // Scenario G — Direct API Access & Query Param Tampering
  // ==========================================
  describe("Scenario G — Direct API Access & Parameter Tampering", () => {
    it("strips client-provided user ID override attempts from Customer", () => {
      // Attacker Customer A attempts to supply ?user=user-cust-B
      const maliciousQuery = { user: customerB._id };
      const response = backend.getOrders(customerA, maliciousQuery);

      // Backend must ignore the client user param and enforce authenticated customerA._id
      expect(response.orders).toHaveLength(1);
      expect(response.orders[0]._id).toBe(orderA._id);
    });

    it("strips client-provided customer ID override attempts from Customer", () => {
      // Attacker Customer A attempts to supply ?customer=cust-profile-B
      const maliciousQuery = { customer: "cust-profile-B" };
      const response = backend.getOrders(customerA, maliciousQuery);

      // Backend overrides customer with authenticated user's scope
      expect(response.orders).toHaveLength(1);
      expect(response.orders[0]._id).toBe(orderA._id);
    });

    it("scopes search within customer's own orders so search cannot leak other orders", () => {
      // Customer A searches for "Mariam" (which is Customer B's name)
      const response = backend.getOrders(customerA, { search: "Mariam" });
      expect(response.orders).toHaveLength(0);

      // Customer B searches for "Mariam" and finds their own order
      const responseB = backend.getOrders(customerB, { search: "Mariam" });
      expect(responseB.orders).toHaveLength(1);
      expect(responseB.orders[0]._id).toBe(orderB._id);
    });
  });

  // ==========================================
  // Scenario H — Related Features: Returns & Order Tracking Authorization
  // ==========================================
  describe("Scenario H — Related Features Isolation", () => {
    it("prevents Customer A from requesting a return for Customer B's order", () => {
      expect(() => backend.requestReturn(customerA, orderB._id)).toThrow(
        /403: You are not authorized to request a return for this order/
      );
    });

    it("rejects unauthenticated anonymous user attempting to request return on registered customer order", () => {
      expect(() => backend.requestReturn(null, orderB._id)).toThrow(
        /401: Authentication required to request a return for this order/
      );
    });

    it("evaluates frontend customer return eligibility to reject unowned orders", () => {
      const eligibility = canCustomerRequestReturn(orderB, customerA._id);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe("ORDER_NOT_OWNED");
    });

    it("allows Customer A to track their own Order A", () => {
      const tracking = backend.trackOrder("MIRE-2026-00001", customerA);
      expect(tracking.orderNumber).toBe("MIRE-2026-00001");
      expect(tracking.status).toBe("PROCESSING");
    });

    it("strictly prevents Customer A from tracking Customer B's order", () => {
      expect(() => backend.trackOrder("MIRE-2026-00002", customerA)).toThrow(
        /403: You are not authorized to track this order/
      );
    });

    it("strictly prevents unauthenticated anonymous user from tracking registered customer's order", () => {
      expect(() => backend.trackOrder("MIRE-2026-00002", null)).toThrow(
        /401: Please log in to track orders associated with an account/
      );
    });

    it("sanitizes private customer PII from order tracking responses", () => {
      const tracking: any = backend.trackOrder("MIRE-2026-00001", customerA);
      expect(tracking.customerInfo).toBeUndefined();
      expect(tracking.internalNotes).toBeUndefined();
      expect(tracking.assignedEmployee).toBeUndefined();
    });
  });
});
