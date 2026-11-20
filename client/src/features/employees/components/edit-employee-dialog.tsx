"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { UserCheck, Loader2, ShieldAlert, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  updateEmployeeSchema,
  type UpdateEmployeeFormValues,
} from "../schemas/employee.schema";
import { useUpdateEmployee } from "../hooks/use-update-employee";
import { RolePermissionsForm } from "./role-permissions-form";
import {
  SUPPORTED_EMPLOYEE_ROLES,
  PERMISSIONS,
} from "@/config/rbac.config";
import { can } from "@/lib/permissions/can";
import type { Employee } from "../types/employee.types";
import type { SafeUser } from "@/lib/auth/types";

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  currentUser: SafeUser | null;
  initialTab?: "general" | "permissions";
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  currentUser,
  initialTab = "general",
}: EditEmployeeDialogProps) {
  if (!employee) return null;

  return (
    <EditEmployeeDialogContent
      key={`${employee._id}-${initialTab}-${open}`}
      open={open}
      onOpenChange={onOpenChange}
      employee={employee}
      currentUser={currentUser}
      initialTab={initialTab}
    />
  );
}

interface EditEmployeeDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  currentUser: SafeUser | null;
  initialTab?: "general" | "permissions";
}

function EditEmployeeDialogContent({
  open,
  onOpenChange,
  employee,
  currentUser,
  initialTab = "general",
}: EditEmployeeDialogContentProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = React.useState<"general" | "permissions">(initialTab);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<UpdateEmployeeFormValues>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      name: employee.name,
      phone: employee.phone || "",
      role: employee.role,
      permissions: employee.permissions || [],
      password: "",
    },
  });

  const { mutate: doUpdateEmployee, isPending } = useUpdateEmployee(() => {
    onOpenChange(false);
  });

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isTargetSuperAdmin = employee.role === "SUPER_ADMIN";
  const isSelf = currentUser ? currentUser.id === employee._id : false;
  const canEdit = can(currentUser?.role, PERMISSIONS.EMPLOYEES_UPDATE, currentUser?.permissions);
  const canManageRoles = can(currentUser?.role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES, currentUser?.permissions);

  const availableRoles = SUPPORTED_EMPLOYEE_ROLES.filter((role) => {
    if (role === "SUPER_ADMIN") return isSuperAdmin;
    return true;
  });

  const watchedRole = useWatch({ control: form.control, name: "role" });
  const selectedRole = watchedRole || employee.role;
  const watchedPermissions = useWatch({ control: form.control, name: "permissions" });
  const selectedPermissions = watchedPermissions || [];

  function onSubmit(values: UpdateEmployeeFormValues) {
    setServerError(null);

    const payload: UpdateEmployeeFormValues = {
      ...(canEdit
        ? {
            name: values.name,
            phone: values.phone ? values.phone : undefined,
            ...(values.password ? { password: values.password } : {}),
          }
        : {}),
      ...(canManageRoles && !isSelf ? { role: values.role } : {}),
      ...(canManageRoles ? { permissions: values.permissions } : {}),
    };

    doUpdateEmployee(
      { id: employee._id, payload },
      {
        onError: (err) => {
          setServerError(err.message);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white text-foreground dark:bg-card border border-border shadow-2xl">
        <div className="p-6 pb-0 border-b border-border/50 shrink-0 space-y-3">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
                <UserCheck className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif">
                  {t("employees-dialog-edit-title") || "Edit Employee"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {employee.name} ({employee.email})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Tab switch */}
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "general"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("employees-tab-general") || "General Info & Role"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("permissions")}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "permissions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("employees-tab-permissions") || "Permissions Matrix"}
            </button>
          </div>
        </div>

        {serverError && (
          <div className="mx-6 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 shrink-0">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form
          id="edit-employee-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {activeTab === "general" ? (
            <div className="space-y-4">
              {!canEdit && (
                <div className="rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                  {t("employees-perm-no-edit-perm") ||
                    "You do not have permission to update employee profile details."}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-medium">
                    {t("employees-field-name") || "Full Name"}
                  </Label>
                  <Input
                    id="edit-name"
                    {...form.register("name")}
                    disabled={isPending || !canEdit}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-xs font-medium">
                    {t("employees-field-phone") || "Phone Number"}
                  </Label>
                  <Input
                    id="edit-phone"
                    placeholder="+20 100 123 4567"
                    {...form.register("phone")}
                    disabled={isPending || !canEdit}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-role" className="text-xs font-medium">
                    {t("employees-field-role") || "Staff Role"}
                  </Label>
                  {isSelf && (
                    <span className="text-[11px] text-muted-foreground">
                      {t("employees-self-role-notice") || "Self role cannot be modified."}
                    </span>
                  )}
                  {isTargetSuperAdmin && !isSuperAdmin && (
                    <span className="text-[11px] text-destructive">
                      {t("employees-superadmin-locked") || "Super Admin role can only be altered by Super Admin."}
                    </span>
                  )}
                </div>

                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending || isSelf || (!isSuperAdmin && isTargetSuperAdmin) || !canManageRoles}
                    >
                      <SelectTrigger id="edit-role" className="w-full">
                        <SelectValue placeholder={t("employees-field-role-select") || "Select Role"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`employees-role-${role}`) || role.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Optional Password Reset */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {t("employees-reset-password-heading") || "Reset Password (Optional)"}
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder={t("employees-reset-password-ph") || "Leave blank to keep existing password"}
                  {...form.register("password")}
                  disabled={isPending || !canEdit}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {!canManageRoles && (
                <div className="rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                  {t("employees-perm-no-manage-perm") || "You do not have permission to manage permissions."}
                </div>
              )}
              <RolePermissionsForm
                selectedRole={selectedRole}
                selectedPermissions={selectedPermissions}
                onChange={(perms) => form.setValue("permissions", perms)}
                disabled={isPending || !canManageRoles}
                currentUser={currentUser}
              />
            </div>
          )}
        </form>

        <div className="p-4 px-6 border-t border-border/60 bg-muted/10 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("employees-action-cancel") || "Cancel"}
          </Button>
          <Button
            type="submit"
            form="edit-employee-form"
            disabled={isPending || (!canEdit && !canManageRoles)}
          >
            {isPending && <Loader2 className="size-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />}
            {t("employees-action-save") || "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
