"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, History } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { LowStockAlerts } from "./low-stock-alerts";
import { InventoryMovementsTable } from "./inventory-movements-table";
import type {
  LowStockItem,
  LowStockPaginatedResponse,
  InventoryMovementsPaginatedResponse,
} from "../types/inventory.types";

interface InventoryTabsProps {
  initialLowStock?: LowStockPaginatedResponse;
  initialMovements?: InventoryMovementsPaginatedResponse;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAdjustStock: (item: LowStockItem) => void;
  canAdjust: boolean;
}

export function InventoryTabs({
  initialLowStock,
  initialMovements,
  activeTab,
  onTabChange,
  onAdjustStock,
  canAdjust,
}: InventoryTabsProps) {
  // Translation
  const t = useTranslations();

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="bg-muted/70 p-1">
        <TabsTrigger
          value="alerts"
          className="gap-2 text-xs data-[state=active]:bg-background"
        >
          <AlertTriangle className="size-3.5 text-amber-500" />
          <span>{t("inventory-tab-overview") || "Low Stock Alerts"}</span>
        </TabsTrigger>
        <TabsTrigger
          value="movements"
          className="gap-2 text-xs data-[state=active]:bg-background"
        >
          <History className="size-3.5 text-blue-500" />
          <span>{t("inventory-tab-movements") || "Movement History"}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="alerts" className="focus-visible:outline-none">
        <LowStockAlerts
          initialData={initialLowStock}
          onAdjustStock={onAdjustStock}
          canAdjust={canAdjust}
        />
      </TabsContent>

      <TabsContent value="movements" className="focus-visible:outline-none">
        <InventoryMovementsTable initialData={initialMovements} />
      </TabsContent>
    </Tabs>
  );
}
