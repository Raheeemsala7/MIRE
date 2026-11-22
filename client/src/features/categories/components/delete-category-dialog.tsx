"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import type { CategoryItem } from "../types/category.types";
import { deleteCategoryAction } from "../apis/categories.action";
import { countDirectSubcategories } from "../utils/category.util";

interface DeleteCategoryDialogProps {
  category: CategoryItem | null;
  allCategories?: CategoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteCategoryDialog({
  category,
  allCategories = [],
  open,
  onOpenChange,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!category) return null;

  const subcategoriesCount = countDirectSubcategories(category._id, allCategories);
  const hasActiveSubcategories = subcategoriesCount > 0;

  async function handleDelete() {
    if (!category || isDeleting) return;

    if (hasActiveSubcategories) {
      toast.error(t("category-delete-has-children"));
      return;
    }

    try {
      setIsDeleting(true);
      const res = await deleteCategoryAction(category._id, category.slug);

      if (res.success) {
        toast.success(t("category-delete-success"));
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.error || t("category-delete-has-children"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5 text-destructive mb-1">
            <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("category-delete-title")}
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-sm space-y-2 text-foreground/80 pt-1">
            <p>
              {t("category-delete-desc")}
            </p>
            <div className="p-2.5 rounded-lg border border-border/80 bg-muted/40 font-mono text-xs">
              <span className="font-semibold text-foreground">{category.name}</span>
              <span className="text-muted-foreground ms-2">({category.slug})</span>
            </div>

            {hasActiveSubcategories && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 mt-2">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{t("category-delete-has-children")}</span>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isDeleting}>
            {t("category-form-cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting || hasActiveSubcategories}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin me-2" />
                {t("category-delete-deleting")}
              </>
            ) : (
              t("category-delete-confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
