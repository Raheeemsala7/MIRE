import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import type { Session } from "next-auth";

describe("Customer RBAC Permissions", () => {
  it("grants SUPER_ADMIN full access to view and update customers", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.CUSTOMERS_VIEW, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.CUSTOMERS_UPDATE, ["*"])).toBe(true);
    // Even if stripped backend permissions, SUPER_ADMIN wildcard allows
    expect(can("SUPER_ADMIN", PERMISSIONS.CUSTOMERS_VIEW, [])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.CUSTOMERS_UPDATE, [])).toBe(true);
  });

  it("grants ADMIN access to view and update customers when backend permissions match", () => {
    expect(
      can("ADMIN", PERMISSIONS.CUSTOMERS_VIEW, [
        "dashboard:read",
        "customers:read",
        "customers:write",
      ])
    ).toBe(true);

    expect(
      can("ADMIN", PERMISSIONS.CUSTOMERS_UPDATE, [
        "dashboard:read",
        "customers:read",
        "customers:write",
      ])
    ).toBe(true);

    // If backend permission is missing
    expect(
      can("ADMIN", PERMISSIONS.CUSTOMERS_UPDATE, ["customers:read"])
    ).toBe(false);
  });

  it("grants ORDER_MANAGER and CUSTOMER_SUPPORT read access but denies update", () => {
    expect(
      can("ORDER_MANAGER", PERMISSIONS.CUSTOMERS_VIEW, ["customers:read"])
    ).toBe(true);
    expect(
      can("ORDER_MANAGER", PERMISSIONS.CUSTOMERS_UPDATE, ["customers:read", "customers:write"])
    ).toBe(false);

    expect(
      can("CUSTOMER_SUPPORT", PERMISSIONS.CUSTOMERS_VIEW, ["customers:read"])
    ).toBe(true);
    expect(
      can("CUSTOMER_SUPPORT", PERMISSIONS.CUSTOMERS_UPDATE, ["customers:read", "customers:write"])
    ).toBe(false);
  });

  it("denies access to unauthorized roles (INVENTORY_MANAGER, ACCOUNTANT, CUSTOMER)", () => {
    const deniedRoles = ["INVENTORY_MANAGER", "ACCOUNTANT", "CUSTOMER"] as const;

    for (const role of deniedRoles) {
      expect(can(role, PERMISSIONS.CUSTOMERS_VIEW, ["customers:read"])).toBe(false);
      expect(can(role, PERMISSIONS.CUSTOMERS_UPDATE, ["customers:write"])).toBe(false);
    }
  });

  it("assertSessionPermission verifies session authentication and customer permissions", () => {
    // Missing session
    const noSessionResult = assertSessionPermission(null, PERMISSIONS.CUSTOMERS_VIEW);
    expect(noSessionResult.authorized).toBe(false);
    expect(noSessionResult.status).toBe(401);

    // Session with Admin role and permissions
    const adminSession: Session = {
      expires: "2099-01-01",
      user: {
        id: "emp-1",
        name: "Admin User",
        email: "admin@mirefashion.com",
        role: "ADMIN",
        permissions: ["customers:read", "customers:write"],
      },
    };
    const adminAuth = assertSessionPermission(adminSession, PERMISSIONS.CUSTOMERS_VIEW);
    expect(adminAuth.authorized).toBe(true);
    expect(adminAuth.status).toBe(200);

    // Session with Customer role attempting to view customers
    const customerSession: Session = {
      expires: "2099-01-01",
      user: {
        id: "cust-1",
        name: "Customer User",
        email: "customer@example.com",
        role: "CUSTOMER",
        permissions: [],
      },
    };
    const customerAuth = assertSessionPermission(customerSession, PERMISSIONS.CUSTOMERS_VIEW);
    expect(customerAuth.authorized).toBe(false);
    expect(customerAuth.status).toBe(403);
  });
});
