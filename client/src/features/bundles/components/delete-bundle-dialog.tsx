"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useDeleteBundle } from "../hooks/use-delete-bundle";
import type { Bundle } from "../types/bundle.types";

interface DeleteBundleDialogProps {
  bundle: Bundle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteBundleDialog({
  bundle,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBundleDialogProps) {
  const t = useTranslations();
  const { mutate: deleteBundle, isPending } = useDeleteBundle(() => {
    onOpenChange(false);
    onSuccess?.();
  });

  if (!bundle) return null;

  function handleConfirm() {
    if (!bundle?._id || isPending) return;
    deleteBundle(bundle._id);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-foreground">
            {t("bundle-delete-title") || "Delete Promotional Bundle"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <span>
              {t("bundle-delete-desc") ||
                "Are you sure you want to permanently delete this promotional bundle? This action cannot be undone."}
            </span>
            <span className="block p-2 rounded-md bg-muted/50 border border-border/60 font-medium text-foreground">
              {bundle.title} ({bundle.slug})
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="text-xs">
            {t("bundle-delete-cancel") || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs gap-1.5"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {isPending
              ? t("bundle-delete-deleting") || "Deleting..."
              : t("bundle-delete-confirm") || "Delete Offer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
