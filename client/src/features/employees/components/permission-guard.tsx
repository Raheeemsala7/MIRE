import * as React from "react";
import { can } from "@/lib/permissions/can";
import type { Permission } from "@/config/rbac.config";
import type { AppRole } from "@/lib/auth/types";

interface PermissionGuardProps {
  role?: AppRole | string | null;
  permissions?: readonly string[] | null;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  role,
  permissions,
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const isAllowed = can(role, permission, permissions);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
