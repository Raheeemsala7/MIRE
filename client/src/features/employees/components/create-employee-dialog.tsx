"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, UserPlus, Loader2, ShieldAlert, Shield, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
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
  createEmployeeSchema,
  type CreateEmployeeFormValues,
} from "../schemas/employee.schema";
import { useCreateEmployee } from "../hooks/use-create-employee";
import { RolePermissionsForm } from "./role-permissions-form";
import {
  CREATABLE_EMPLOYEE_ROLES,
  BACKEND_DEFAULT_ROLE_PERMISSIONS,
  type CreatableEmployeeRole,
} from "@/config/rbac.config";
import type { SafeUser } from "@/lib/auth/types";
import type { CreateEmployeePayload } from "../types/employee.types";

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser?: SafeUser | null;
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
  currentUser,
}: CreateEmployeeDialogProps) {
  const t = useTranslations();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPermissionsCustomizer, setShowPermissionsCustomizer] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "CUSTOMER_SUPPORT",
      permissions: [...BACKEND_DEFAULT_ROLE_PERMISSIONS.CUSTOMER_SUPPORT],
    },
  });

  const { mutate: doCreateEmployee, isPending } = useCreateEmployee(() => {
    form.reset();
    setShowPermissionsCustomizer(false);
    setServerError(null);
    onOpenChange(false);
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });
  const selectedPermissions = useWatch({ control: form.control, name: "permissions" }) || [];

  // Update permissions preset when role changes unless user already explicitly customized
  function handleRoleChange(newRole: CreatableEmployeeRole) {
    form.setValue("role", newRole);
    if (!showPermissionsCustomizer) {
      const defaults = BACKEND_DEFAULT_ROLE_PERMISSIONS[newRole] || [];
      form.setValue("permissions", [...defaults]);
    }
  }

  function onSubmit(values: CreateEmployeeFormValues) {
    setServerError(null);
    const payload: CreateEmployeePayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone || undefined,
      role: values.role,
      ...(showPermissionsCustomizer && values.permissions ? { permissions: values.permissions } : {}),
    };
    doCreateEmployee(payload, {
      onError: (err) => {
        setServerError(err.message);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white text-foreground dark:bg-card border border-border shadow-2xl">
        <div className="p-6 pb-4 border-b border-border/50 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
                <UserPlus className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif">
                  {t("employees-dialog-create-title") || "Add New Employee"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("employees-dialog-create-desc") ||
                    "Create an employee account and configure operational permissions."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {serverError && (
          <div className="mx-6 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 shrink-0">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form
          id="create-employee-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-medium">
                {t("employees-field-name") || "Full Name"} *
              </Label>
              <Input
                id="create-name"
                placeholder={t("employees-field-name-ph") || "e.g. Layla El-Sayed"}
                {...form.register("name")}
                disabled={isPending}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-xs font-medium">
                {t("employees-field-email") || "Email Address"} *
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder={t("employees-field-email-ph") || "layla@mirefashion.com"}
                {...form.register("email")}
                disabled={isPending}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="create-password" className="text-xs font-medium">
                {t("employees-field-password") || "Temporary Password"} *
              </Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                  disabled={isPending}
                  className="pr-10 rtl:pr-3 rtl:pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:right-auto rtl:left-3"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="create-phone" className="text-xs font-medium">
                {t("employees-field-phone") || "Phone Number"}
              </Label>
              <Input
                id="create-phone"
                placeholder="+20 100 123 4567"
                {...form.register("phone")}
                disabled={isPending}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="create-role" className="text-xs font-medium">
              {t("employees-field-role") || "Staff Role"} *
            </Label>
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => handleRoleChange(val as CreatableEmployeeRole)}
                  disabled={isPending}
                >
                  <SelectTrigger id="create-role" className="w-full">
                    <SelectValue placeholder={t("employees-field-role-select") || "Select Role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATABLE_EMPLOYEE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`employees-role-${role}`) || role.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.role && (
              <p className="text-xs text-destructive">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          {/* Permissions Customization Section */}
          <div className="pt-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Shield className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {t("employees-permissions-heading") || "Operational Permissions"}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                      {selectedPermissions.length} {t("employees-perm-flags-active") || "active"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {showPermissionsCustomizer
                      ? t("employees-perm-customizing") || "Customizing granular permissions:"
                      : t("employees-perm-default-notice") || "Using standard role preset permissions."}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant={showPermissionsCustomizer ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowPermissionsCustomizer(!showPermissionsCustomizer)}
                className="text-xs h-7.5 px-3 gap-1 shrink-0 font-medium"
              >
                <span>
                  {showPermissionsCustomizer
                    ? t("employees-perm-collapse") || "Collapse Permissions"
                    : t("employees-perm-customize-btn") || "Customize Permissions"}
                </span>
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    showPermissionsCustomizer ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            {showPermissionsCustomizer && (
              <div className="pt-3">
                <RolePermissionsForm
                  selectedRole={selectedRole}
                  selectedPermissions={selectedPermissions}
                  onChange={(perms) => form.setValue("permissions", perms)}
                  disabled={isPending}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
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
          <Button type="submit" form="create-employee-form" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />}
            {t("employees-action-create-submit") || "Create Employee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
