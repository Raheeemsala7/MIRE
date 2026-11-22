"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { deleteBundleAction } from "../apis/bundles.action";
import { bundleQueryKeys } from "./use-bundles";

export function useDeleteBundle(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (id: string) => deleteBundleAction(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all });
      toast.success(
        t("bundle-delete-success") || "Bundle deleted successfully",
        {
          description: response.message,
        }
      );
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(
        t("bundle-delete-error") || "Failed to delete bundle",
        {
          description: error.message,
        }
      );
    },
  });
}
