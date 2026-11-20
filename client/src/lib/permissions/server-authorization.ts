import "server-only";

import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth/session";
import type { SafeUser, SessionRecord } from "@/lib/auth/types";
import { can } from "./can";
import { PERMISSIONS, type Permission } from "@/config/rbac.config";

export interface AuthorizationResult {
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  user?: SafeUser;
}

export interface MutationValidationParams {
  actingUser: SafeUser;
  targetUserId?: string;
  targetUserRole?: string;
  newRole?: string;
  newPermissions?: string[];
  isStatusToggle?: boolean;
}

export interface MutationValidationResult {
  valid: boolean;
  statusCode?: 400 | 403;
  message?: string;
}

/**
 * Server Component authorization guard.
 * Verifies session and required permission; redirects to login or 403 if unauthorized.
 */
export async function requirePermission(
  permission: Permission,
  locale: string = "ar"
): Promise<SafeUser> {
  const session = await currentSession();

  if (!session) {
    redirect(`/api/auth/clear-session?callbackUrl=/${locale}/auth/login`);
  }

  const user = session.user;
  const isAllowed = can(user.role, permission, user.permissions);

  if (!isAllowed) {
    redirect(`/${locale}/403`);
  }

  return user;
}

/**
 * Server Route Handler / Action authorization check.
 * Returns structured result instead of redirecting.
 */
export function assertSessionPermission(
  session: SessionRecord | null,
  permission: Permission
): AuthorizationResult {
  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required",
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

/**
 * Validates security constraints on employee modifications:
 * 1. Only Super Admin can grant or revoke Super Admin privileges.
 * 2. Delegated Admin cannot modify a higher-privileged (Super Admin) account.
 * 3. Delegated Admin cannot promote another user to Super Admin.
 * 4. Delegated Admin cannot grant permissions beyond their own authority.
 * 5. Self-lockout prevention: Cannot deactivate oneself or alter own role.
 * 6. Managing roles requires `employees.manage_roles` permission.
 * 7. Toggling status requires `employees.toggle_status` permission.
 */
export function validateEmployeeMutation({
  actingUser,
  targetUserId,
  targetUserRole,
  newRole,
  newPermissions,
  isStatusToggle,
}: MutationValidationParams): MutationValidationResult {
  const isSuperAdmin = actingUser.role === "SUPER_ADMIN";
  const isSelf = targetUserId ? String(actingUser.id) === String(targetUserId) : false;

  // 1. Status toggle authorization & rules
  if (isStatusToggle) {
    if (!can(actingUser.role, PERMISSIONS.EMPLOYEES_TOGGLE_STATUS, actingUser.permissions)) {
      return {
        valid: false,
        statusCode: 403,
        message: "You do not have permission to activate or deactivate employees.",
      };
    }

    if (isSelf) {
      return {
        valid: false,
        statusCode: 400,
        message: "Self-deactivation is prohibited to prevent accidental lockout.",
      };
    }

    if (targetUserRole === "SUPER_ADMIN") {
      return {
        valid: false,
        statusCode: 403,
        message: "Super Admin accounts cannot be deactivated.",
      };
    }
  }

  // 2. Target user is Super Admin protection
  if (targetUserRole === "SUPER_ADMIN" && !isSuperAdmin) {
    return {
      valid: false,
      statusCode: 403,
      message: "Only Super Admin can modify a Super Admin account.",
    };
  }

  // 3. Role change checks
  if (newRole) {
    // Changing an existing employee's role requires EMPLOYEES_MANAGE_ROLES
    if (targetUserId) {
      if (!can(actingUser.role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES, actingUser.permissions)) {
        return {
          valid: false,
          statusCode: 403,
          message: "You do not have permission to manage employee roles.",
        };
      }
    }

    if (newRole === "SUPER_ADMIN" && !isSuperAdmin) {
      return {
        valid: false,
        statusCode: 403,
        message: "Only a Super Admin can promote or create an account as Super Admin.",
      };
    }

    if (isSelf && newRole !== actingUser.role) {
      return {
        valid: false,
        statusCode: 400,
        message: "You cannot change your own role.",
      };
    }
  }

  // 4. Permissions change checks
  if (newPermissions !== undefined) {
    // Modifying existing employee permissions requires EMPLOYEES_MANAGE_ROLES
    if (targetUserId) {
      if (!can(actingUser.role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES, actingUser.permissions)) {
        return {
          valid: false,
          statusCode: 403,
          message: "You do not have permission to manage employee permissions.",
        };
      }
    }

    if (!isSuperAdmin) {
      // Delegated Admin cannot assign wildcard or permissions they do not possess
      if (newPermissions.includes("*")) {
        return {
          valid: false,
          statusCode: 403,
          message: "Cannot grant wildcard Super Admin permissions.",
        };
      }

      const actingPermissions = actingUser.permissions ?? [];
      const hasExcessPermission = newPermissions.some(
        (perm) => !actingPermissions.includes(perm)
      );

      if (hasExcessPermission) {
        return {
          valid: false,
          statusCode: 403,
          message: "You cannot grant permissions that you do not hold yourself.",
        };
      }
    }
  }

  return { valid: true };
}
