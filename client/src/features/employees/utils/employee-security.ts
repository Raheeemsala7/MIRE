import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SafeUser } from "@/lib/auth/types";

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
 * Validates security constraints on employee modifications
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
