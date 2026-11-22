/**
 * Centralized Role-Based Access Control (RBAC) Configuration
 *
 * This configuration dictates which roles have permission to perform specific
 * operations across the dashboard. UI components, navigation, server components,
 * and API route handlers all derive their authorization checks from this single source of truth.
 *
 * To delegate or revoke Admin abilities (e.g. allowing Admins to create employees or toggle status),
 * modify the `ROLE_PERMISSIONS.ADMIN` array below.
 */

import type { AppRole } from "@/lib/auth/types";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export const PERMISSIONS = {
  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_CREATE: "employees.create",
  EMPLOYEES_UPDATE: "employees.update",
  EMPLOYEES_MANAGE_ROLES: "employees.manage_roles",
  EMPLOYEES_TOGGLE_STATUS: "employees.toggle_status",
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_UPDATE: "customers.update",
  RETURNS_VIEW: "returns.view",
  RETURNS_UPDATE_STATUS: "returns.update_status",
  RETURNS_INSPECT: "returns.inspect",
  RETURNS_ASSIGN: "returns.assign",
  RETURNS_LOG_CALL: "returns.log_call",
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_ARCHIVE: "products.archive",
  BUNDLES_VIEW: "bundles.view",
  BUNDLES_CREATE: "bundles.create",
  BUNDLES_UPDATE: "bundles.update",
  BUNDLES_DELETE: "bundles.delete",
  ORDERS_VIEW: "orders.view",
  ORDERS_UPDATE: "orders.update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Mapping of Dashboard roles to permitted actions.
 * Super Admin possesses full access ("*").
 * Admin permissions are strictly delegated per least-privilege principles.
 * Non-admin staff (ORDER_MANAGER, CUSTOMER_SUPPORT, etc.) have no access to employee management.
 */
export const ROLE_PERMISSIONS: Record<AppRole, readonly (Permission | "*")[]> = {
  SUPER_ADMIN: ["*"],

  ADMIN: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_ARCHIVE,
    PERMISSIONS.BUNDLES_VIEW,
    PERMISSIONS.BUNDLES_CREATE,
    PERMISSIONS.BUNDLES_UPDATE,
    PERMISSIONS.BUNDLES_DELETE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.RETURNS_VIEW,
    PERMISSIONS.RETURNS_UPDATE_STATUS,
    PERMISSIONS.RETURNS_INSPECT,
    PERMISSIONS.RETURNS_ASSIGN,
    PERMISSIONS.RETURNS_LOG_CALL,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    // Delegated actions (uncomment to grant to Admin without changing any UI code):
    // PERMISSIONS.EMPLOYEES_CREATE,
    // PERMISSIONS.EMPLOYEES_UPDATE,
    // PERMISSIONS.EMPLOYEES_MANAGE_ROLES,
    // PERMISSIONS.EMPLOYEES_TOGGLE_STATUS,
  ],

  ORDER_MANAGER: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.RETURNS_VIEW,
    PERMISSIONS.RETURNS_UPDATE_STATUS,
    PERMISSIONS.RETURNS_INSPECT,
    PERMISSIONS.RETURNS_ASSIGN,
    PERMISSIONS.RETURNS_LOG_CALL,
  ],
  CUSTOMER_SUPPORT: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.RETURNS_VIEW,
    PERMISSIONS.RETURNS_UPDATE_STATUS,
    PERMISSIONS.RETURNS_LOG_CALL,
  ],
  INVENTORY_MANAGER: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_ARCHIVE,
  ],
  ACCOUNTANT: [],
  CUSTOMER: [],
} as const;

/**
 * Maps frontend application permissions to corresponding Express backend permission requirements.
 */
export const PERMISSION_BACKEND_MAP: Record<Permission, string> = {
  [PERMISSIONS.EMPLOYEES_VIEW]: "employees:read",
  [PERMISSIONS.EMPLOYEES_CREATE]: "employees:write",
  [PERMISSIONS.EMPLOYEES_UPDATE]: "employees:write",
  [PERMISSIONS.EMPLOYEES_MANAGE_ROLES]: "employees:write",
  [PERMISSIONS.EMPLOYEES_TOGGLE_STATUS]: "employees:write",
  [PERMISSIONS.CUSTOMERS_VIEW]: "customers:read",
  [PERMISSIONS.CUSTOMERS_UPDATE]: "customers:write",
  [PERMISSIONS.RETURNS_VIEW]: "returns:read",
  [PERMISSIONS.RETURNS_UPDATE_STATUS]: "returns:write",
  [PERMISSIONS.RETURNS_INSPECT]: "returns:write",
  [PERMISSIONS.RETURNS_ASSIGN]: "returns:write",
  [PERMISSIONS.RETURNS_LOG_CALL]: "returns:write",
  [PERMISSIONS.PRODUCTS_VIEW]: "products:read",
  [PERMISSIONS.PRODUCTS_CREATE]: "products:write",
  [PERMISSIONS.PRODUCTS_UPDATE]: "products:write",
  [PERMISSIONS.PRODUCTS_ARCHIVE]: "products:write",
  [PERMISSIONS.BUNDLES_VIEW]: "bundles:read",
  [PERMISSIONS.BUNDLES_CREATE]: "bundles:write",
  [PERMISSIONS.BUNDLES_UPDATE]: "bundles:write",
  [PERMISSIONS.BUNDLES_DELETE]: "bundles:write",
  [PERMISSIONS.ORDERS_VIEW]: "orders:read",
  [PERMISSIONS.ORDERS_UPDATE]: "orders:write",
};

/**
 * Supported employee roles recognized by backend model UserRoles.
 */
export const SUPPORTED_EMPLOYEE_ROLES = ADMIN_ROLES;

export type SupportedEmployeeRole = (typeof SUPPORTED_EMPLOYEE_ROLES)[number];

/**
 * Roles assignable during employee creation (POST /employees schema forbids SUPER_ADMIN creation).
 */
export const CREATABLE_EMPLOYEE_ROLES = [
  "ADMIN",
  "ORDER_MANAGER",
  "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER",
  "ACCOUNTANT",
] as const;

export type CreatableEmployeeRole = (typeof CREATABLE_EMPLOYEE_ROLES)[number];

/**
 * Canonical backend permission catalog categorized for granular permission assignment.
 */
export interface BackendPermissionDefinition {
  id: string;
  category: "dashboard" | "orders" | "products" | "categories" | "inventory" | "bundles" | "coupons" | "customers" | "returns" | "social" | "payments" | "employees" | "reports" | "settings";
  labelKey: string;
  descriptionKey: string;
}

export const BACKEND_PERMISSIONS_CATALOG: readonly BackendPermissionDefinition[] = [
  // Dashboard
  { id: "dashboard:read", category: "dashboard", labelKey: "perm-dashboard-read", descriptionKey: "perm-dashboard-read-desc" },

  // Orders
  { id: "orders:read", category: "orders", labelKey: "perm-orders-read", descriptionKey: "perm-orders-read-desc" },
  { id: "orders:write", category: "orders", labelKey: "perm-orders-write", descriptionKey: "perm-orders-write-desc" },
  { id: "orders:export", category: "orders", labelKey: "perm-orders-export", descriptionKey: "perm-orders-export-desc" },

  // Products & Categories
  { id: "products:read", category: "products", labelKey: "perm-products-read", descriptionKey: "perm-products-read-desc" },
  { id: "products:write", category: "products", labelKey: "perm-products-write", descriptionKey: "perm-products-write-desc" },
  { id: "categories:read", category: "categories", labelKey: "perm-categories-read", descriptionKey: "perm-categories-read-desc" },
  { id: "categories:write", category: "categories", labelKey: "perm-categories-write", descriptionKey: "perm-categories-write-desc" },

  // Inventory
  { id: "inventory:read", category: "inventory", labelKey: "perm-inventory-read", descriptionKey: "perm-inventory-read-desc" },
  { id: "inventory:write", category: "inventory", labelKey: "perm-inventory-write", descriptionKey: "perm-inventory-write-desc" },

  // Promotions
  { id: "bundles:read", category: "bundles", labelKey: "perm-bundles-read", descriptionKey: "perm-bundles-read-desc" },
  { id: "bundles:write", category: "bundles", labelKey: "perm-bundles-write", descriptionKey: "perm-bundles-write-desc" },
  { id: "coupons:read", category: "coupons", labelKey: "perm-coupons-read", descriptionKey: "perm-coupons-read-desc" },
  { id: "coupons:write", category: "coupons", labelKey: "perm-coupons-write", descriptionKey: "perm-coupons-write-desc" },

  // Customers
  { id: "customers:read", category: "customers", labelKey: "perm-customers-read", descriptionKey: "perm-customers-read-desc" },
  { id: "customers:write", category: "customers", labelKey: "perm-customers-write", descriptionKey: "perm-customers-write-desc" },

  // Returns
  { id: "returns:read", category: "returns", labelKey: "perm-returns-read", descriptionKey: "perm-returns-read-desc" },
  { id: "returns:write", category: "returns", labelKey: "perm-returns-write", descriptionKey: "perm-returns-write-desc" },

  // Social
  { id: "social:read", category: "social", labelKey: "perm-social-read", descriptionKey: "perm-social-read-desc" },
  { id: "social:write", category: "social", labelKey: "perm-social-write", descriptionKey: "perm-social-write-desc" },

  // Payments
  { id: "payments:read", category: "payments", labelKey: "perm-payments-read", descriptionKey: "perm-payments-read-desc" },
  { id: "payments:write", category: "payments", labelKey: "perm-payments-write", descriptionKey: "perm-payments-write-desc" },

  // Employees
  { id: "employees:read", category: "employees", labelKey: "perm-employees-read", descriptionKey: "perm-employees-read-desc" },
  { id: "employees:write", category: "employees", labelKey: "perm-employees-write", descriptionKey: "perm-employees-write-desc" },

  // Reports & Settings
  { id: "reports:read", category: "reports", labelKey: "perm-reports-read", descriptionKey: "perm-reports-read-desc" },
  { id: "settings:read", category: "settings", labelKey: "perm-settings-read", descriptionKey: "perm-settings-read-desc" },
  { id: "settings:write", category: "settings", labelKey: "perm-settings-write", descriptionKey: "perm-settings-write-desc" },
] as const;

/**
 * Backend default role permission presets (matching backend DefaultRolePermissions).
 */
export const BACKEND_DEFAULT_ROLE_PERMISSIONS: Record<SupportedEmployeeRole, readonly string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "dashboard:read",
    "orders:read", "orders:write", "orders:export",
    "products:read", "products:write",
    "categories:read", "categories:write",
    "inventory:read", "inventory:write",
    "bundles:read", "bundles:write",
    "coupons:read", "coupons:write",
    "customers:read", "customers:write",
    "returns:read", "returns:write",
    "social:read", "social:write",
    "payments:read", "payments:write",
    "employees:read", "employees:write",
    "reports:read",
    "settings:read", "settings:write"
  ],
  ORDER_MANAGER: [
    "dashboard:read",
    "orders:read", "orders:write", "orders:export",
    "returns:read", "returns:write",
    "customers:read"
  ],
  CUSTOMER_SUPPORT: [
    "dashboard:read",
    "orders:read",
    "social:read", "social:write",
    "returns:read", "returns:write",
    "customers:read"
  ],
  INVENTORY_MANAGER: [
    "dashboard:read",
    "products:read", "products:write",
    "categories:read", "categories:write",
    "inventory:read", "inventory:write"
  ],
  ACCOUNTANT: [
    "dashboard:read",
    "orders:read", "orders:export",
    "payments:read", "payments:write",
    "reports:read"
  ],
};
