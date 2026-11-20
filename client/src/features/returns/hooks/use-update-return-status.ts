"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  UpdateReturnStatusPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { updateReturnStatus } from "../services/returns.service";
import { returnQueryKeys } from "./use-returns";

interface UpdateStatusVariables {
  id: string;
  payload: UpdateReturnStatusPayload;
}

export function useUpdateReturnStatus(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, UpdateStatusVariables>({
    mutationFn: ({ id, payload }) => updateReturnStatus(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<SingleReturnResponse>(
        returnQueryKeys.detail(variables.id),
        response
      );
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      toast.success(
        t("return-status-update-success") || "Return status updated successfully"
      );
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("return-status-update-error") ||
          "Failed to update return status"
      );
    },
  });
}
