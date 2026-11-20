import { describe, expect, it } from "vitest";
import { can, hasAnyPermission, hasAllPermissions } from "./can";
import { PERMISSIONS } from "@/config/rbac.config";

describe("RBAC can() permission utility", () => {
  it("grants full access to SUPER_ADMIN for any permission via wildcard", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.EMPLOYEES_VIEW)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.EMPLOYEES_CREATE)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.EMPLOYEES_UPDATE)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.EMPLOYEES_MANAGE_ROLES)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.EMPLOYEES_TOGGLE_STATUS)).toBe(true);
  });

  it("evaluates default ADMIN permissions correctly", () => {
    // By default, Admin has employees.view
    expect(can("ADMIN", PERMISSIONS.EMPLOYEES_VIEW)).toBe(false);

    // By default, Admin does NOT have create, update, manage_roles, or toggle_status unless delegated
    expect(can("ADMIN", PERMISSIONS.EMPLOYEES_CREATE)).toBe(false);
    expect(can("ADMIN", PERMISSIONS.EMPLOYEES_UPDATE)).toBe(false);
    expect(can("ADMIN", PERMISSIONS.EMPLOYEES_MANAGE_ROLES)).toBe(false);
    expect(can("ADMIN", PERMISSIONS.EMPLOYEES_TOGGLE_STATUS)).toBe(false);
  });

  it("denies access to non-admin roles by default", () => {
    const nonAdminRoles = [
      "ORDER_MANAGER",
      "CUSTOMER_SUPPORT",
      "INVENTORY_MANAGER",
      "ACCOUNTANT",
      "CUSTOMER",
    ] as const;

    for (const role of nonAdminRoles) {
      expect(can(role, PERMISSIONS.EMPLOYEES_VIEW)).toBe(false);
      expect(can(role, PERMISSIONS.EMPLOYEES_CREATE)).toBe(false);
      expect(can(role, PERMISSIONS.EMPLOYEES_UPDATE)).toBe(false);
      expect(can(role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES)).toBe(false);
      expect(can(role, PERMISSIONS.EMPLOYEES_TOGGLE_STATUS)).toBe(false);
    }
  });

  it("handles null, undefined, or unknown roles safely", () => {
    expect(can(null, PERMISSIONS.EMPLOYEES_VIEW)).toBe(false);
    expect(can(undefined, PERMISSIONS.EMPLOYEES_VIEW)).toBe(false);
    expect(can("UNKNOWN_ROLE", PERMISSIONS.EMPLOYEES_VIEW)).toBe(false);
    expect(can("", PERMISSIONS.EMPLOYEES_VIEW)).toBe(false);
  });

  it("verifies backend permissions array when supplied", () => {
    // If Admin has role-level view permission, but backend permissions list lacks 'employees:read', returns false
    expect(
      can("ADMIN", PERMISSIONS.EMPLOYEES_VIEW, ["dashboard:read", "orders:read"])
    ).toBe(false);

    // If Admin has empty permissions array (all permissions stripped), returns false
    expect(
      can("ADMIN", PERMISSIONS.EMPLOYEES_VIEW, [])
    ).toBe(false);

    // If backend permissions list contains 'employees:read', returns true
    expect(
      can("ADMIN", PERMISSIONS.EMPLOYEES_VIEW, ["dashboard:read", "employees:read"])
    ).toBe(true);

    // Wildcard in backend permissions also satisfies requirement
    expect(
      can("ADMIN", PERMISSIONS.EMPLOYEES_VIEW, ["*"])
    ).toBe(true);

    // Super Admin ignores stripped permissions due to root wildcard
    expect(
      can("SUPER_ADMIN", PERMISSIONS.EMPLOYEES_VIEW, [])
    ).toBe(true);
  });
});

describe("hasAnyPermission & hasAllPermissions", () => {
  it("correctly checks hasAnyPermission", () => {
    expect(
      hasAnyPermission("ADMIN", [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_CREATE,
      ], ["employees:read"])
    ).toBe(true);

    expect(
      hasAnyPermission("ORDER_MANAGER", [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_CREATE,
      ])
    ).toBe(false);
  });

  it("correctly checks hasAllPermissions", () => {
    expect(
      hasAllPermissions("SUPER_ADMIN", [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_CREATE,
      ])
    ).toBe(true);

    expect(
      hasAllPermissions("ADMIN", [
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_CREATE,
      ])
    ).toBe(false);
  });
});
