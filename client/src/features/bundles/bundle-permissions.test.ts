import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import type { Session } from "next-auth";

describe("Bundle RBAC Permissions", () => {
  it("grants SUPER_ADMIN full access to view, create, update, and delete bundles", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.BUNDLES_VIEW, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.BUNDLES_CREATE, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.BUNDLES_UPDATE, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.BUNDLES_DELETE, ["*"])).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.BUNDLES_VIEW, [])).toBe(true);
  });

  it("grants ADMIN access to bundles when backend permissions match", () => {
    expect(
      can("ADMIN", PERMISSIONS.BUNDLES_VIEW, ["bundles:read", "bundles:write"])
    ).toBe(true);
    expect(
      can("ADMIN", PERMISSIONS.BUNDLES_CREATE, ["bundles:read", "bundles:write"])
    ).toBe(true);
    expect(
      can("ADMIN", PERMISSIONS.BUNDLES_UPDATE, ["bundles:read", "bundles:write"])
    ).toBe(true);
    expect(
      can("ADMIN", PERMISSIONS.BUNDLES_DELETE, ["bundles:read", "bundles:write"])
    ).toBe(true);

    // If write permission is missing
    expect(
      can("ADMIN", PERMISSIONS.BUNDLES_CREATE, ["bundles:read"])
    ).toBe(false);
  });

  it("denies bundle mutation access to unauthorized roles (CUSTOMER, CUSTOMER_SUPPORT, ACCOUNTANT)", () => {
    const deniedRoles = ["CUSTOMER", "CUSTOMER_SUPPORT", "ACCOUNTANT"] as const;

    for (const role of deniedRoles) {
      expect(can(role, PERMISSIONS.BUNDLES_CREATE, ["bundles:write"])).toBe(false);
      expect(can(role, PERMISSIONS.BUNDLES_UPDATE, ["bundles:write"])).toBe(false);
      expect(can(role, PERMISSIONS.BUNDLES_DELETE, ["bundles:write"])).toBe(false);
    }
  });

  it("assertSessionPermission verifies session authentication and bundle permissions", () => {
    // Missing session
    const noSessionResult = assertSessionPermission(null, PERMISSIONS.BUNDLES_VIEW);
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
        permissions: ["bundles:read", "bundles:write"],
      },
    };
    const adminAuth = assertSessionPermission(adminSession, PERMISSIONS.BUNDLES_CREATE);
    expect(adminAuth.authorized).toBe(true);
    expect(adminAuth.status).toBe(200);

    // Session with Customer role attempting to create bundle
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
    const customerAuth = assertSessionPermission(customerSession, PERMISSIONS.BUNDLES_CREATE);
    expect(customerAuth.authorized).toBe(false);
    expect(customerAuth.status).toBe(403);
  });
});
