import "server-only";

import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import type { SafeUser } from "@/lib/auth/types";
import type { Session } from "next-auth";
import { normalizeLocale } from "@/lib/auth/permissions";
import { can } from "./can";
import { type Permission } from "@/config/rbac.config";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";

export interface AuthorizationResult {
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  user?: SafeUser;
}

/**
 * Server Component authorization guard.
 * Verifies session and token; redirects directly to login if missing or expired.
 * Redirects to /403 if unauthorized.
 */
export async function requirePermission(
  permission: Permission,
  locale: string = "ar"
): Promise<SafeUser> {
  const normLocale = normalizeLocale(locale);

  // 1. Check NextAuth session
  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/${normLocale}/auth/login`);
  }

  // 2. Check token expiration
  const token = await getNextAuthToken();
  if (!token?.token && !token?.accessToken && !token?.sub && !token?.id) {
    redirect(`/${normLocale}/auth/login`);
  }

  // 3. Check RBAC permissions
  const user = session.user;
  const isAllowed = can(user.role, permission, user.permissions);

  if (!isAllowed) {
    redirect(`/${normLocale}/403`);
  }

  return user;
}

/**
 * Server Route Handler / Action authorization check.
 */
export function assertSessionPermission(
  session: Session | null,
  permission: Permission
): AuthorizationResult {
  if (!session?.user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required or session expired",
    };
  }

  const user = session.user;
  const isAllowed = can(user.role, permission, user.permissions);

  if (!isAllowed) {
    return {
      authorized: false,
      status: 403,
      error: `Access denied. Missing permission: ${permission}`,
      user,
    };
  }

  return {
    authorized: true,
    status: 200,
    user,
  };
}

// Re-export employee mutation validator for backwards compatibility
export * from "@/features/employees/utils/employee-security";
