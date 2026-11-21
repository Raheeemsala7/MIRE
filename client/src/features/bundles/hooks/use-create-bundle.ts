"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { CreateBundleInput } from "../schemas/bundle.schema";
import { createBundleAction } from "../server/actions";
import { bundleQueryKeys } from "./use-bundles";
import type { SingleBundleResponse } from "../types/bundle.types";

export function useCreateBundle(
  onSuccessCallback?: (res: SingleBundleResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (payload: CreateBundleInput) => createBundleAction(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all });
      toast.success(
        t("bundle-create-success") || "Bundle created successfully",
        {
          description: response.data.title,
        }
      );
      onSuccessCallback?.(response);
    },
    onError: (error: Error) => {
      toast.error(
        t("bundle-create-error") || "Failed to create bundle",
        {
          description: error.message,
        }
      );
    },
  });
}
