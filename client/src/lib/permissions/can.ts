import {
  ROLE_PERMISSIONS,
  PERMISSION_BACKEND_MAP,
  type Permission,
} from "@/config/rbac.config";
import type { AppRole } from "@/lib/auth/types";

/**
 * Check if a role and optional user permissions allow a specific application permission.
 *
 * @param role The user's role
 * @param permission The required permission
 * @param userPermissions Optional backend permission array on the user record
 */
export function can(
  role: AppRole | string | undefined | null,
  permission: Permission,
  userPermissions?: readonly string[] | null
): boolean {
  if (!role) return false;

  const validRole = role as AppRole;
  const configured = ROLE_PERMISSIONS[validRole];
  if (!configured) return false;

  // Super Admin wildcard grants all permissions
  if (configured.includes("*")) {
    return true;
  }

  // Check if role is allowed this permission in the centralized config
  if (!configured.includes(permission)) {
    return false;
  }

  // If user-level permissions are present (array, including empty array), verify that the backend permission requirement is also met
  if (Array.isArray(userPermissions)) {
    if (userPermissions.includes("*")) return true;
    const requiredBackendPerm = PERMISSION_BACKEND_MAP[permission];
    if (requiredBackendPerm && !userPermissions.includes(requiredBackendPerm)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if user has at least one of the given permissions.
 */
export function hasAnyPermission(
  role: AppRole | string | undefined | null,
  permissions: readonly Permission[],
  userPermissions?: readonly string[] | null
): boolean {
  return permissions.some((perm) => can(role, perm, userPermissions));
}

/**
 * Checks if user has all of the given permissions.
 */
export function hasAllPermissions(
  role: AppRole | string | undefined | null,
  permissions: readonly Permission[],
  userPermissions?: readonly string[] | null
): boolean {
  return permissions.every((perm) => can(role, perm, userPermissions));
}
