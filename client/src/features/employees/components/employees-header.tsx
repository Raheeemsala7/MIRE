"use client";

import { useTranslations } from "next-intl";
import { UserPlus, Shield } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PermissionGuard } from "./permission-guard";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SafeUser } from "@/lib/auth/types";

interface EmployeesHeaderProps {
  currentUser: SafeUser | null;
  onCreateClick: () => void;
}

export function EmployeesHeader({
  currentUser,
  onCreateClick,
}: EmployeesHeaderProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Shield className="size-5" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
            {t("employees-title") || "Employees Management"}
          </h1>
        </div>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl">
          {t("employees-subtitle") ||
            "Manage your team, assign roles, and control access to the dashboard."}
        </p>
      </div>

      <PermissionGuard
        role={currentUser?.role}
        permissions={currentUser?.permissions}
        permission={PERMISSIONS.EMPLOYEES_CREATE}
      >
        <Button onClick={onCreateClick} className="shrink-0 gap-2">
          <UserPlus className="size-4" />
          <span>{t("employees-btn-create") || "Create Employee"}</span>
        </Button>
      </PermissionGuard>
    </div>
  );
}
