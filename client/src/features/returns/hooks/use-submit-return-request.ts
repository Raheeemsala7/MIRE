"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  RequestReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { submitReturnRequestAction } from "../actions/return.actions";
import { returnQueryKeys } from "./use-returns";

export function useSubmitReturnRequest(
  onSuccessCallback?: (data: SingleReturnResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, RequestReturnPayload>({
    mutationFn: (payload: RequestReturnPayload) =>
      submitReturnRequestAction(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.deliveredOrders() });
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
