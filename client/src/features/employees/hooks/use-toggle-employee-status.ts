"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { toggleEmployeeStatus } from "../services/employees.service";
import { employeeQueryKeys } from "./use-employees";

export function useToggleEmployeeStatus(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (id: string) => toggleEmployeeStatus(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(id),
      });
      const statusKey = response.data.isActive
        ? "employees-status-active"
        : "employees-status-inactive";
      toast.success(
        t("employees-status-update-success") || "Employee status updated",
        {
          description: `${response.data.name} is now ${t(statusKey) || (response.data.isActive ? "Active" : "Inactive")}`,
        }
      );
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(
        t("employees-status-update-error") || "Failed to update status",
        {
          description: error.message,
        }
      );
    },
  });
}
