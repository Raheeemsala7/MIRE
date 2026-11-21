"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Edit,
  UserCheck,
  UserX,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { can } from "@/lib/permissions/can";
import {
  PERMISSIONS,
  BACKEND_PERMISSIONS_CATALOG,
} from "@/config/rbac.config";
import {
  getRoleBadgeVariant,
  formatEmployeeDate,
  formatPermissionLabel,
} from "../utils/employee.util";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EmployeeStatusDialog } from "./employee-status-dialog";
import type { Employee } from "../types/employee.types";
import type { SafeUser } from "@/lib/auth/types";

interface EmployeeDetailsProps {
  employee: Employee;
  currentUser: SafeUser | null;
  locale: string;
}

export function EmployeeDetails({
  employee,
  currentUser,
  locale,
}: EmployeeDetailsProps) {
  const t = useTranslations();
  const [editOpen, setEditOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [editTab, setEditTab] = React.useState<"general" | "permissions">("general");

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isTargetSuperAdmin = employee.role === "SUPER_ADMIN";
  const isSelf = currentUser ? currentUser.id === employee._id : false;
  const canModifyTarget = isSuperAdmin || !isTargetSuperAdmin;

  const canEdit = can(currentUser?.role, PERMISSIONS.EMPLOYEES_UPDATE, currentUser?.permissions);
  const canManageRoles = can(currentUser?.role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES, currentUser?.permissions);
  const canToggle = can(currentUser?.role, PERMISSIONS.EMPLOYEES_TOGGLE_STATUS, currentUser?.permissions);

  const isWildcard = employee.permissions.includes("*");

  // Map employee permissions into catalog labels
  const permissionCatalogMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of BACKEND_PERMISSIONS_CATALOG) {
      map.set(item.id, t(item.labelKey) || item.id);
    }
    return map;
  }, [t]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back navigation */}
      <div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" />
          <span>{t("employees-back-to-list") || "Back to Employees"}</span>
        </Link>
      </div>

      {/* Main Identity Card */}
      <Card className="border border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-6 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-bold text-primary text-2xl uppercase">
              {employee.name.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  {employee.name}
                </h2>
                <Badge
                  variant={getRoleBadgeVariant(employee.role)}
                  className="text-xs"
                >
                  {t(`employees-role-${employee.role}`) || employee.role.replace("_", " ")}
                </Badge>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    employee.isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      employee.isActive ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  {employee.isActive
                    ? t("employees-status-active") || "Active"
                    : t("employees-status-inactive") || "Inactive"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ID: <code className="text-[11px] select-all">{employee._id}</code>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {canEdit && canModifyTarget && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditTab("general");
                  setEditOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit className="size-3.5" />
                <span>{t("employees-action-edit") || "Edit Profile"}</span>
              </Button>
            )}

            {canManageRoles && canModifyTarget && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditTab("permissions");
                  setEditOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Shield className="size-3.5" />
                <span>{t("employees-action-manage-perms") || "Manage Permissions"}</span>
              </Button>
            )}

            {canToggle && !isSelf && canModifyTarget && (
              <Button
                variant={employee.isActive ? "destructive" : "default"}
                size="sm"
                onClick={() => setStatusOpen(true)}
                className="gap-1.5 text-xs"
              >
                {employee.isActive ? (
                  <>
                    <UserX className="size-3.5" />
                    <span>{t("employees-action-deactivate") || "Deactivate"}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="size-3.5" />
                    <span>{t("employees-action-activate") || "Activate"}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground uppercase block">
                  {t("employees-field-email") || "Email"}
                </span>
                <span className="text-xs font-medium text-foreground truncate block">
                  {employee.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground uppercase block">
                  {t("employees-field-phone") || "Phone"}
                </span>
                <span className="text-xs font-medium text-foreground truncate block">
                  {employee.phone || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground uppercase block">
                  {t("employees-col-created") || "Joined"}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {formatEmployeeDate(employee.createdAt, locale)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground uppercase block">
                  {t("employees-field-last-login") || "Last Login"}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {formatEmployeeDate(employee.lastLogin, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Matrix section */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  {t("employees-details-permissions-heading") || "Authorized Dashboard Capabilities"}
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {isWildcard
                  ? t("employees-perm-all-granted") || "All Capabilities Granted (*)"
                  : `${employee.permissions.length} ${t("employees-perm-flags-active") || "active permission flags"}`}
              </span>
            </div>

            {isWildcard ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
                <Lock className="size-5 text-primary shrink-0" />
                <div>
                  <h5 className="text-xs font-semibold text-primary">
                    {t("employees-superadmin-wildcard-title") || "Full Super Administrator Authority"}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("employees-superadmin-wildcard-desc") ||
                      "This account bypasses granular permission checks and holds root execution rights across all business modules."}
                  </p>
                </div>
              </div>
            ) : employee.permissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                {t("employees-perm-empty") || "No granular permissions assigned to this staff profile."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {employee.permissions.map((perm) => (
                  <Badge
                    key={perm}
                    variant="outline"
                    className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-normal bg-card"
                  >
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{permissionCatalogMap.get(perm) || formatPermissionLabel(perm)}</span>
                    <span className="text-[10px] text-muted-foreground">({perm})</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditEmployeeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        employee={employee}
        currentUser={currentUser}
        initialTab={editTab}
      />

      <EmployeeStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        employee={employee}
      />
    </div>
  );
}
