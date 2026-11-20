import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { can } from "@/lib/permissions/can";
import { assertSessionPermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { Session } from "next-auth";

describe("Returns RBAC & Permission Rules", () => {
  it("grants full Returns access to SUPER_ADMIN without requiring explicit permissions array", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.RETURNS_VIEW)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.RETURNS_UPDATE_STATUS)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.RETURNS_INSPECT)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.RETURNS_ASSIGN)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.RETURNS_LOG_CALL)).toBe(true);
  });

  it("grants full Returns management to ADMIN with backend returns:read & returns:write", () => {
    const adminPerms = ["returns:read", "returns:write"];

    expect(can("ADMIN", PERMISSIONS.RETURNS_VIEW, adminPerms)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.RETURNS_UPDATE_STATUS, adminPerms)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.RETURNS_INSPECT, adminPerms)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.RETURNS_ASSIGN, adminPerms)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.RETURNS_LOG_CALL, adminPerms)).toBe(true);
  });

  it("grants operational Returns management to ORDER_MANAGER with backend permissions", () => {
    const omPerms = ["returns:read", "returns:write"];

    expect(can("ORDER_MANAGER", PERMISSIONS.RETURNS_VIEW, omPerms)).toBe(true);
    expect(can("ORDER_MANAGER", PERMISSIONS.RETURNS_UPDATE_STATUS, omPerms)).toBe(true);
    expect(can("ORDER_MANAGER", PERMISSIONS.RETURNS_INSPECT, omPerms)).toBe(true);
    expect(can("ORDER_MANAGER", PERMISSIONS.RETURNS_ASSIGN, omPerms)).toBe(true);
    expect(can("ORDER_MANAGER", PERMISSIONS.RETURNS_LOG_CALL, omPerms)).toBe(true);
  });

  it("grants customer contact & status updates to CUSTOMER_SUPPORT but denies inspect and assign", () => {
    const csPerms = ["returns:read", "returns:write"];

    expect(can("CUSTOMER_SUPPORT", PERMISSIONS.RETURNS_VIEW, csPerms)).toBe(true);
    expect(can("CUSTOMER_SUPPORT", PERMISSIONS.RETURNS_UPDATE_STATUS, csPerms)).toBe(true);
    expect(can("CUSTOMER_SUPPORT", PERMISSIONS.RETURNS_LOG_CALL, csPerms)).toBe(true);

    // Customer support does not have inspect or assign in ROLE_PERMISSIONS
    expect(can("CUSTOMER_SUPPORT", PERMISSIONS.RETURNS_INSPECT, csPerms)).toBe(false);
    expect(can("CUSTOMER_SUPPORT", PERMISSIONS.RETURNS_ASSIGN, csPerms)).toBe(false);
  });

  it("denies Returns management to INVENTORY_MANAGER and ACCOUNTANT", () => {
    expect(can("INVENTORY_MANAGER", PERMISSIONS.RETURNS_VIEW, ["inventory:read"])).toBe(false);
    expect(can("ACCOUNTANT", PERMISSIONS.RETURNS_VIEW, ["payments:read"])).toBe(false);
  });

  it("denies admin Returns endpoints to CUSTOMER role", () => {
    expect(can("CUSTOMER", PERMISSIONS.RETURNS_VIEW, ["orders:read_own"])).toBe(false);
    expect(can("CUSTOMER", PERMISSIONS.RETURNS_UPDATE_STATUS, ["orders:read_own"])).toBe(false);
    expect(can("CUSTOMER", PERMISSIONS.RETURNS_INSPECT, ["orders:read_own"])).toBe(false);
  });

  it("denies access if user record is missing required backend permission", () => {
    // Has returns:read but missing returns:write
    expect(can("ADMIN", PERMISSIONS.RETURNS_VIEW, ["returns:read"])).toBe(true);
    expect(can("ADMIN", PERMISSIONS.RETURNS_UPDATE_STATUS, ["returns:read"])).toBe(false);
    expect(can("ADMIN", PERMISSIONS.RETURNS_INSPECT, ["returns:read"])).toBe(false);
  });

  it("assertSessionPermission enforces route handler authorization correctly for customer support", () => {
    const unauthenticated = assertSessionPermission(null, PERMISSIONS.RETURNS_VIEW);
    expect(unauthenticated.authorized).toBe(false);
    expect(unauthenticated.status).toBe(401);

    const supportSession: Session = {
      expires: "2099-01-01",
      user: {
        id: "support-1",
        name: "Support Staff",
        email: "support@mirefashion.com",
        role: "CUSTOMER_SUPPORT",
        permissions: ["returns:read", "returns:write"],
      },
    };

    // Support can view, log call, and update status
    expect(assertSessionPermission(supportSession, PERMISSIONS.RETURNS_VIEW).authorized).toBe(true);
    expect(assertSessionPermission(supportSession, PERMISSIONS.RETURNS_UPDATE_STATUS).authorized).toBe(true);
    expect(assertSessionPermission(supportSession, PERMISSIONS.RETURNS_LOG_CALL).authorized).toBe(true);

    // Support gets 403 on inspect and assign
    const inspectCheck = assertSessionPermission(supportSession, PERMISSIONS.RETURNS_INSPECT);
    expect(inspectCheck.authorized).toBe(false);
    expect(inspectCheck.status).toBe(403);

    const assignCheck = assertSessionPermission(supportSession, PERMISSIONS.RETURNS_ASSIGN);
    expect(assignCheck.authorized).toBe(false);
    expect(assignCheck.status).toBe(403);
  });
});
