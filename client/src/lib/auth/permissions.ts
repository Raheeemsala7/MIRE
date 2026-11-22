import type { AppRole, SafeUser } from "./types";
import { isAdminRole, isCustomerRole, hasPermission } from "./roles";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";

export function normalizeLocale(locale: unknown): "ar" | "en" {
  return locale === "en" ? "en" : "ar";
}

export function destination(role: AppRole, locale: string = "ar", permissions?: string[]) {
  const language = normalizeLocale(locale);
  if (isCustomerRole(role)) return `/${language}`;
  const user = { id: "", name: "", email: "", role, permissions };
  if (isAdminRole(role) && hasPermission(user, "dashboard:read")) return `/${language}/admin/dashboard`;
  if (isAdminRole(role) && can(role, PERMISSIONS.ORDERS_VIEW, permissions)) return `/${language}/admin/orders`;
  if (isAdminRole(role) && can(role, PERMISSIONS.RETURNS_VIEW, permissions)) return `/${language}/admin/returns`;
  if (isAdminRole(role) && can(role, PERMISSIONS.CUSTOMERS_VIEW, permissions)) return `/${language}/admin/customers`;
  if (isAdminRole(role) && can(role, PERMISSIONS.EMPLOYEES_VIEW, permissions)) return `/${language}/admin/employees`;
  if (isAdminRole(role) && can(role, PERMISSIONS.COUPONS_VIEW, permissions)) return `/${language}/admin/coupons`;
  if (isAdminRole(role) && can(role, PERMISSIONS.INVENTORY_VIEW, permissions)) return `/${language}/admin/inventory`;
  return `/${language}/403`;
}

/** Only known, authorized application destinations can be a login callback. */
export function loginDestination(user: SafeUser, locale: string, callbackUrl?: string) {
  const language = normalizeLocale(locale);
  const fallback = destination(user.role, language, user.permissions);
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//") || /[\\\u0000-\u0020]/.test(callbackUrl)) return fallback;
  const url = new URL(callbackUrl, "https://mire.invalid");
  if (url.origin !== "https://mire.invalid" || !url.pathname.startsWith(`/${language}`)) return fallback;
  const path = url.pathname.slice(language.length + 1) || "/";
  if (isCustomerRole(user.role) && (/^\/$|^\/(account|orders|cart|checkout|products)(\/|$)/.test(path))) return url.pathname + url.search;
  if (isAdminRole(user.role)) {
    if ((path === "/admin" || path === "/admin/" || path === "/admin/dashboard") && hasPermission(user, "dashboard:read")) return `/${language}/admin/dashboard`;
    if (/^\/admin\/orders(?:\/[a-zA-Z0-9_-]+)?$/.test(path) && can(user.role, PERMISSIONS.ORDERS_VIEW, user.permissions)) return url.pathname + url.search;
    if (/^\/admin\/coupons(?:\/[a-zA-Z0-9_-]+)?$/.test(path) && can(user.role, PERMISSIONS.COUPONS_VIEW, user.permissions)) return url.pathname + url.search;
    if (/^\/admin\/returns(?:\/[a-zA-Z0-9_-]+)?$/.test(path) && can(user.role, PERMISSIONS.RETURNS_VIEW, user.permissions)) return url.pathname + url.search;
    if (/^\/admin\/customers(?:\/[a-zA-Z0-9_-]+)?$/.test(path) && can(user.role, PERMISSIONS.CUSTOMERS_VIEW, user.permissions)) return url.pathname + url.search;
    if (/^\/admin\/employees(?:\/[a-zA-Z0-9_-]+)?$/.test(path) && can(user.role, PERMISSIONS.EMPLOYEES_VIEW, user.permissions)) return url.pathname + url.search;
    if (/^\/admin\/inventory(?:\/[a-zA-Z0-9_-]+)?$/.test(path) && can(user.role, PERMISSIONS.INVENTORY_VIEW, user.permissions)) return url.pathname + url.search;
  }
  return fallback;
}
