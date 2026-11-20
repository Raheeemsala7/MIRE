"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  AssignReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { assignReturn } from "../services/returns.service";
import { returnQueryKeys } from "./use-returns";

interface AssignReturnVariables {
  id: string;
  payload: AssignReturnPayload;
}

export function useAssignReturn(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, AssignReturnVariables>({
    mutationFn: ({ id, payload }) => assignReturn(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<SingleReturnResponse>(
        returnQueryKeys.detail(variables.id),
        response
      );
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      toast.success(
        t("return-assign-success") || "Return assigned to employee successfully"
      );
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("return-assign-error") ||
          "Failed to assign return"
      );
    },
  });
}
