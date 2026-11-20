"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  RequestReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { submitReturnRequest } from "../services/returns.service";
import { returnQueryKeys } from "./use-returns";

export function useSubmitReturnRequest(
  onSuccessCallback?: (data: SingleReturnResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, RequestReturnPayload>({
    mutationFn: (payload: RequestReturnPayload) => submitReturnRequest(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      toast.success(
        t("customer-returns-success-title") ||
          "Return request submitted successfully"
      );
      onSuccessCallback?.(response);
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("customer-returns-error") ||
          "Failed to submit return request"
      );
    },
  });
}
