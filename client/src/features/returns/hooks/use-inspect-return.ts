"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  InspectReturnPayload,
  SingleReturnResponse,
} from "../types/return.types";
import { inspectReturn } from "../services/returns.service";
import { returnQueryKeys } from "./use-returns";

interface InspectReturnVariables {
  id: string;
  payload: InspectReturnPayload;
}

export function useInspectReturn(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleReturnResponse, Error, InspectReturnVariables>({
    mutationFn: ({ id, payload }) => inspectReturn(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<SingleReturnResponse>(
        returnQueryKeys.detail(variables.id),
        response
      );
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.all });
      // Also invalidate low-stock inventory cache so refreshed inventory is reflected
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(
        t("return-inspect-success") ||
          "Inspection recorded and eligible inventory restocked"
      );
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("return-inspect-error") ||
          "Failed to record inspection"
      );
    },
  });
}
