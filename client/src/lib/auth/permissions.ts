import type { AppRole } from "./types";

export function destination(role: AppRole) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/dashboard";
  if (role === "CUSTOMER") return "/store";
  return "/403";
}
