import type { AppRole, SafeUser } from "./types";

export const ADMIN_ROLES = [
  "SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER", "ACCOUNTANT",
] as const satisfies readonly AppRole[];

export function isAdminRole(role: unknown): role is (typeof ADMIN_ROLES)[number] {
  return ADMIN_ROLES.some((candidate) => candidate === role);
}

export function isCustomerRole(role: unknown): role is "CUSTOMER" {
  return role === "CUSTOMER";
}

export function isAppRole(role: unknown): role is AppRole {
  return isAdminRole(role) || isCustomerRole(role);
}

export function hasRole(role: unknown, roles: readonly AppRole[]): boolean {
  return isAppRole(role) && roles.includes(role);
}

/** Permission strings come from the backend catalog; missing metadata denies access. */
export function hasPermission(user: SafeUser | null | undefined, permission: string): boolean {
  return !!user && isAppRole(user.role) &&
    (user.role === "SUPER_ADMIN" || !!user.permissions?.some((value) => value === "*" || value === permission));
}
