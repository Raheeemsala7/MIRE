"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  RequestReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { adminCreateReturnAction } from "../actions/return.actions";
import { returnQueryKeys } from "./use-returns";

export function useAdminCreateReturn(
  onSuccessCallback?: (data: SingleReturnResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, RequestReturnPayload>({
    mutationFn: (payload: RequestReturnPayload) =>
      adminCreateReturnAction(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      toast.success(
        t("returns-create-success") || "Return request created successfully"
      );
      onSuccessCallback?.(response);
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("returns-error-action") ||
          "Failed to create return request"
      );
    },
  });
}
