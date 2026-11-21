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
import { useArchiveProduct } from "../../hooks/use-archive-product";
import type { Product } from "../../types/product.types";

interface ArchiveProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ArchiveProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ArchiveProductDialogProps) {
  const t = useTranslations();
  const { mutate: archiveProduct, isPending } = useArchiveProduct(() => {
    onOpenChange(false);
    onSuccess?.();
  });

  if (!product) return null;

  function handleConfirm() {
    if (!product?._id || isPending) return;
    archiveProduct(product._id);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-foreground">
            {t("product-archive-title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <span>{t("product-archive-desc")}</span>
            <span className="block p-2 rounded-md bg-muted/50 border border-border/60 font-medium text-foreground">
              {product.name} ({product.sku})
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="text-xs">
            {t("product-archive-cancel")}
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
            {isPending ? t("product-archive-archiving") : t("product-archive-confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
