"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { toggleBundleStatusAction } from "../apis/bundles.action";
import { bundleQueryKeys } from "./use-bundles";
import type { SingleBundleResponse } from "../types/bundle.types";

export function useToggleBundleStatus(
  onSuccessCallback?: (res: SingleBundleResponse) => void
) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleBundleStatusAction(id, isActive),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: bundleQueryKeys.detail(response.data._id),
      });
      toast.success(
        response.data.isActive
          ? t("bundle-status-activated") || "Bundle activated"
          : t("bundle-status-deactivated") || "Bundle deactivated",
        {
          description: response.data.title,
        }
      );
      onSuccessCallback?.(response);
    },
    onError: (error: Error) => {
      toast.error(
        t("bundle-status-toggle-error") || "Failed to update bundle status",
        {
          description: error.message,
        }
      );
    },
  });
}
