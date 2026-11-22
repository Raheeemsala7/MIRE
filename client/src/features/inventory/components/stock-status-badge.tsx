"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/shared/components/ui/badge";
import type { StockStatus, InventoryMovementType } from "../types/inventory.types";
import { cn } from "cn";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const t = useTranslations();

  if (status === "OUT_OF_STOCK") {
    return (
      <Badge
        variant="destructive"
        className={cn("px-2 py-0.5 text-xs font-medium", className)}
      >
        {t("inventory-status-out-of-stock") || "Out of Stock"}
      </Badge>
    );
  }

  if (status === "LOW_STOCK") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:text-amber-300",
          className
        )}
      >
        {t("inventory-status-low-stock") || "Low Stock"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300",
        className
      )}
    >
      {t("inventory-status-in-stock") || "In Stock"}
    </span>
  );
}

interface MovementTypeBadgeProps {
  type: InventoryMovementType;
  className?: string;
}

export function MovementTypeBadge({ type, className }: MovementTypeBadgeProps) {
  const t = useTranslations();

  const configMap: Record<
    InventoryMovementType,
    { labelKey: string; defaultLabel: string; className: string }
  > = {
    PURCHASE: {
      labelKey: "inventory-movement-PURCHASE",
      defaultLabel: "Purchase / Restock",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300",
    },
    SALE: {
      labelKey: "inventory-movement-SALE",
      defaultLabel: "Sale",
      className:
        "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-500/40 dark:text-blue-300",
    },
    RETURN: {
      labelKey: "inventory-movement-RETURN",
      defaultLabel: "Customer Return",
      className:
        "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:border-purple-500/40 dark:text-purple-300",
    },
    ADJUSTMENT: {
      labelKey: "inventory-movement-ADJUSTMENT",
      defaultLabel: "Manual Adjustment",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-500/40 dark:text-amber-300",
    },
    DAMAGE: {
      labelKey: "inventory-movement-DAMAGE",
      defaultLabel: "Damaged / Defect",
      className:
        "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-500/40 dark:text-rose-300",
    },
    RESERVATION: {
      labelKey: "inventory-movement-RESERVATION",
      defaultLabel: "Order Reservation",
      className:
        "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-500/40 dark:text-sky-300",
    },
    RELEASE: {
      labelKey: "inventory-movement-RELEASE",
      defaultLabel: "Reservation Release",
      className:
        "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
    },
  };

  const config = configMap[type] ?? {
    labelKey: "",
    defaultLabel: type,
    className: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        config.className,
        className
      )}
    >
      {t(config.labelKey) || config.defaultLabel}
    </span>
  );
}
