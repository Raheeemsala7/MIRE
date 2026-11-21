import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import type { Session } from "next-auth";

describe("Product RBAC Permissions", () => {
  it("grants SUPER_ADMIN full access to view, create, update, and archive products", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.PRODUCTS_VIEW, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.PRODUCTS_CREATE, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.PRODUCTS_UPDATE, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.PRODUCTS_ARCHIVE, ["*"])).toBe(true);
    // Wildcard allows even if permissions list is empty
    expect(can("SUPER_ADMIN", PERMISSIONS.PRODUCTS_VIEW, [])).toBe(true);
  });

  it("grants ADMIN access to products when backend permissions match", () => {
    expect(
      can("ADMIN", PERMISSIONS.PRODUCTS_VIEW, ["products:read", "products:write"])
    ).toBe(true);
    expect(
      can("ADMIN", PERMISSIONS.PRODUCTS_CREATE, ["products:read", "products:write"])
    ).toBe(true);
    expect(
      can("ADMIN", PERMISSIONS.PRODUCTS_UPDATE, ["products:read", "products:write"])
    ).toBe(true);
    expect(
      can("ADMIN", PERMISSIONS.PRODUCTS_ARCHIVE, ["products:read", "products:write"])
    ).toBe(true);

    // If backend permission is missing
    expect(
      can("ADMIN", PERMISSIONS.PRODUCTS_CREATE, ["products:read"])
    ).toBe(false);
  });

  it("grants INVENTORY_MANAGER access to products when permissions match", () => {
    expect(
      can("INVENTORY_MANAGER", PERMISSIONS.PRODUCTS_VIEW, ["products:read"])
    ).toBe(true);
    expect(
      can("INVENTORY_MANAGER", PERMISSIONS.PRODUCTS_UPDATE, ["products:write"])
    ).toBe(true);
  });

  it("denies product mutation access to unauthorized roles (CUSTOMER, CUSTOMER_SUPPORT, ACCOUNTANT)", () => {
    const deniedRoles = ["CUSTOMER", "CUSTOMER_SUPPORT", "ACCOUNTANT"] as const;

    for (const role of deniedRoles) {
      expect(can(role, PERMISSIONS.PRODUCTS_CREATE, ["products:write"])).toBe(false);
      expect(can(role, PERMISSIONS.PRODUCTS_UPDATE, ["products:write"])).toBe(false);
      expect(can(role, PERMISSIONS.PRODUCTS_ARCHIVE, ["products:write"])).toBe(false);
    }
  });

  it("assertSessionPermission verifies session authentication and product permissions", () => {
    // Missing session
    const noSessionResult = assertSessionPermission(null, PERMISSIONS.PRODUCTS_VIEW);
    expect(noSessionResult.authorized).toBe(false);
    expect(noSessionResult.status).toBe(401);

    // Session with Admin role and write permissions
    const adminSession: Session = {
      expires: "2099-01-01",
      user: {
        id: "emp-1",
        name: "Admin User",
        email: "admin@mirefashion.com",
        role: "ADMIN",
        permissions: ["products:read", "products:write"],
      },
    };
    const adminAuth = assertSessionPermission(adminSession, PERMISSIONS.PRODUCTS_CREATE);
    expect(adminAuth.authorized).toBe(true);
    expect(adminAuth.status).toBe(200);

    // Session with Customer role attempting to create product
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
    const customerAuth = assertSessionPermission(customerSession, PERMISSIONS.PRODUCTS_CREATE);
    expect(customerAuth.authorized).toBe(false);
    expect(customerAuth.status).toBe(403);
  });
});
