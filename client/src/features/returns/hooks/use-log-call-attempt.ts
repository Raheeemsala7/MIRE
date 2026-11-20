"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  LogCallAttemptPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { logReturnCallAttempt } from "../services/returns.service";
import { returnQueryKeys } from "./use-returns";

interface LogCallAttemptVariables {
  id: string;
  payload: LogCallAttemptPayload;
}

export function useLogCallAttempt(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, LogCallAttemptVariables>({
    mutationFn: ({ id, payload }) => logReturnCallAttempt(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<SingleReturnResponse>(
        returnQueryKeys.detail(variables.id),
        response
      );
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      toast.success(
        t("return-call-success") || "Customer call attempt recorded"
      );
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("return-call-error") ||
          "Failed to record call attempt"
      );
    },
  });
}
