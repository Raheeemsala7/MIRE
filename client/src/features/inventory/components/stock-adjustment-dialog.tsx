"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { StockAdjustmentForm } from "./stock-adjustment-form";
import type { LowStockItem } from "../types/inventory.types";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItem?: LowStockItem | null;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  preselectedItem,
}: StockAdjustmentDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <SlidersHorizontal className="size-4.5 text-amber-500" />
            <span>
              {t("inventory-adjust-dialog-title") || "Manual Stock Adjustment"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {t("inventory-adjust-dialog-desc") ||
              "Manually adjust inventory for a specific product variant with a required audit trail reason."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <StockAdjustmentForm
            key={
              preselectedItem
                ? `${preselectedItem.productId}-${preselectedItem.variantSku}`
                : "manual-select"
            }
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
            preselectedItem={preselectedItem}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
