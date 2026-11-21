"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { UpdateEmployeePayload } from "../types/employee.types";
import { updateEmployeeAction } from "../actions/employee.actions";
import { employeeQueryKeys } from "./use-employees";

interface UpdateParams {
  id: string;
  payload: UpdateEmployeePayload;
}

export function useUpdateEmployee(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateParams) => updateEmployeeAction(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(variables.id),
      });
      toast.success(
        t("employees-update-success") || "Employee updated successfully",
        {
          description: `${response.data.name} (${response.data.role})`,
        }
      );
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(
        t("employees-update-error") || "Failed to update employee",
        {
          description: error.message,
        }
      );
    },
  });
}
