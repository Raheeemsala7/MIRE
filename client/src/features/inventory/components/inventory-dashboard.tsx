"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { SlidersHorizontal, Warehouse } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { InventoryOverview } from "./inventory-overview";
import { InventoryTabs } from "./inventory-tabs";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import type {
  LowStockItem,
  LowStockPaginatedResponse,
  InventoryMovementsPaginatedResponse,
  InventoryOverviewStats,
} from "../types/inventory.types";
import type { ProductsPaginatedResponse } from "@/features/products/types/product.types";
import type { SafeUser } from "@/lib/auth/types";

interface InventoryDashboardProps {
  initialLowStock?: LowStockPaginatedResponse;
  initialMovements?: InventoryMovementsPaginatedResponse;
  initialProducts?: ProductsPaginatedResponse;
  overviewStats: InventoryOverviewStats;
  currentUser: SafeUser | null;
  locale: string;
}

export function InventoryDashboard({
  initialLowStock,
  initialMovements,
  initialProducts,
  overviewStats,
  currentUser,
}: InventoryDashboardProps) {
  // Translation
  const t = useTranslations();

  // Navigation & URL
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = React.useTransition();

  // Active tab from URL
  const activeTab = searchParams.get("tab") === "movements" ? "movements" : "alerts";

  // Dialog state
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);
  const [preselectedItem, setPreselectedItem] =
    React.useState<LowStockItem | null>(null);

  // RBAC
  const canAdjust = can(
    currentUser?.role,
    PERMISSIONS.INVENTORY_ADJUST,
    currentUser?.permissions
  );

  // Functions
  function handleTabChange(nextTab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "alerts") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    startTransition(() => {
      const q = params.toString();
      router.replace(`${pathname}${q ? `?${q}` : ""}`);
    });
  }

  function handleOpenAdjust(item?: LowStockItem) {
    if (!canAdjust) return;
    setPreselectedItem(item ?? null);
    setIsAdjustOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Warehouse className="size-6 text-primary" />
            <span>{t("inventory-title") || "Inventory Management"}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("inventory-description") ||
              "Monitor stock levels, review inventory movements, and manage manual stock adjustments."}
          </p>
        </div>

        {canAdjust && (
          <Button
            onClick={() => handleOpenAdjust()}
            className="h-9 gap-1.5 text-xs font-medium self-start sm:self-auto shadow-xs"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{t("inventory-btn-adjust") || "Adjust Stock"}</span>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <InventoryOverview stats={overviewStats} />

      {/* Main Tabs (Alerts, All Warehouse Products & Audit Trail with URL synchronization) */}
      <InventoryTabs
        initialLowStock={initialLowStock}
        initialMovements={initialMovements}
        initialProducts={initialProducts}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAdjustStock={(item) => handleOpenAdjust(item)}
        canAdjust={canAdjust}
      />

      {/* Stock Adjustment Dialog */}
      {canAdjust && (
        <StockAdjustmentDialog
          open={isAdjustOpen}
          onOpenChange={setIsAdjustOpen}
          preselectedItem={preselectedItem}
        />
      )}
    </div>
  );
}
