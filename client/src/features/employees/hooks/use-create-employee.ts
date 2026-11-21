"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { CreateEmployeePayload } from "../types/employee.types";
import { createEmployeeAction } from "../actions/employee.actions";
import { employeeQueryKeys } from "./use-employees";

export function useCreateEmployee(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployeeAction(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      toast.success(
        t("employees-create-success") || "Employee created successfully",
        {
          description: `${response.data.name} (${response.data.email})`,
        }
      );
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(
        t("employees-create-error") || "Failed to create employee",
        {
          description: error.message,
        }
      );
    },
  });
}
