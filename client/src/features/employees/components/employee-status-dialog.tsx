"use client";

import { useTranslations } from "next-intl";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/components/ui/alert-dialog";
import { buttonVariants } from "@/shared/components/ui/button";
import { useToggleEmployeeStatus } from "../hooks/use-toggle-employee-status";
import type { Employee } from "../types/employee.types";

interface EmployeeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeStatusDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeStatusDialogProps) {
  const t = useTranslations();

  const { mutate: doToggleStatus, isPending } = useToggleEmployeeStatus(() => {
    onOpenChange(false);
  });

  if (!employee) return null;

  const willDeactivate = employee.isActive;

  function handleConfirm() {
    if (!employee) return;
    doToggleStatus(employee._id);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2.5 ${
                willDeactivate
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <AlertDialogTitle>
                {willDeactivate
                  ? t("employees-dialog-deactivate-title") || "Deactivate Employee Account?"
                  : t("employees-dialog-activate-title") || "Activate Employee Account?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs">
                {employee.name} ({employee.email})
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <p className="text-xs text-muted-foreground pt-1">
          {willDeactivate
            ? t("employees-dialog-deactivate-warning") ||
              "Deactivating this staff member will revoke their administrative dashboard access. Any active tokens will no longer be authorized."
            : t("employees-dialog-activate-notice") ||
              "Activating this employee account will immediately restore their dashboard privileges and ability to sign in."}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("employees-action-cancel") || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className={buttonVariants({
              variant: willDeactivate ? "destructive" : "default",
            })}
          >
            {isPending && <Loader2 className="size-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />}
            {willDeactivate
              ? t("employees-action-deactivate-confirm") || "Yes, Deactivate"
              : t("employees-action-activate-confirm") || "Yes, Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
