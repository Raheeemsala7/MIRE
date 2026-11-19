import type { AppRole } from "./types";

export function destination(role: AppRole, locale: string = "ar") {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return `/${locale}/admin/dashboard`;
  if (role === "CUSTOMER") return `/${locale}`;
  return `/${locale}/403`;
}
