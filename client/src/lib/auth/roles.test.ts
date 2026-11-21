import { describe, expect, it } from "vitest";
import { ADMIN_ROLES, hasRole, isAdminRole, isCustomerRole, hasPermission } from "./roles";
import { destination, loginDestination } from "./permissions";
import type { SafeUser } from "./types";
const base = { id: "user", name: "Nour", email: "nour@example.com" };
const customer: SafeUser = { ...base, role: "CUSTOMER" };
const admin: SafeUser = { ...base, role: "ADMIN", permissions: ["dashboard:read", "employees:read"] };

describe("centralized identity and destinations", () => {
  it.each(ADMIN_ROLES)("routes %s staff with the actual dashboard permission", (role) => {
    expect(isAdminRole(role)).toBe(true);
    expect(isCustomerRole(role)).toBe(false);
    expect(destination(role, "en", ["dashboard:read"])).toBe("/en/admin/dashboard");
  });
  it("denies unknown roles, missing permissions, and customer admin access", () => {
    expect(isAdminRole("ROOT")).toBe(false);
    expect(isCustomerRole("ROOT")).toBe(false);
    expect(hasRole("ROOT", ADMIN_ROLES)).toBe(false);
    expect(hasRole("CUSTOMER", ADMIN_ROLES)).toBe(false);
    expect(hasPermission({ ...admin, permissions: [] }, "dashboard:read")).toBe(false);
    expect(destination("ADMIN", "en", [])).toBe("/en/403");
  });
  it("retains authorized intended paths in the current locale", () => {
    expect(loginDestination(customer, "en", "/en/checkout")).toBe("/en/checkout");
    expect(loginDestination(admin, "ar", "/ar/admin/employees?page=2")).toBe("/ar/admin/employees?page=2");
    expect(loginDestination(admin, "en", "/en/admin")).toBe("/en/admin/dashboard");
  });
  it("routes staff with customers permission to customers directory", () => {
    expect(destination("ADMIN", "en", ["customers:read"])).toBe("/en/admin/customers");
    expect(destination("ADMIN", "ar", ["returns:read"])).toBe("/ar/admin/returns");
  });
  it.each(["https://evil.invalid", "//evil.invalid", "/\\evil.invalid", "/en/../ar/admin/dashboard", "/en/admin/dashboard", "/en/auth/login", "/enother/path"])("rejects unsafe or unauthorized customer callback %s", (callback) => {
    expect(loginDestination(customer, "en", callback)).toBe("/en");
  });
});
