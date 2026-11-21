"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { UpdateBundleInput } from "../schemas/bundle.schema";
import { updateBundleAction } from "../server/actions";
import { bundleQueryKeys } from "./use-bundles";
import type { SingleBundleResponse } from "../types/bundle.types";

export function useUpdateBundle(
  id: string,
  onSuccessCallback?: (res: SingleBundleResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (payload: UpdateBundleInput) => updateBundleAction(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.detail(id) });
      toast.success(
        t("bundle-update-success") || "Bundle updated successfully",
        {
          description: response.data.title,
        }
      );
      onSuccessCallback?.(response);
    },
    onError: (error: Error) => {
      toast.error(
        t("bundle-update-error") || "Failed to update bundle",
        {
          description: error.message,
        }
      );
    },
  });
}
