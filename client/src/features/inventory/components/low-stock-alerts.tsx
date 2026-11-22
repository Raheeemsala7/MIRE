"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { LowStockTable } from "./low-stock-table";
import { useLowStock } from "../hooks/use-low-stock";
import type {
  LowStockItem,
  LowStockPaginatedResponse,
} from "../types/inventory.types";

interface LowStockAlertsProps {
  initialData?: LowStockPaginatedResponse;
  onAdjustStock: (item: LowStockItem) => void;
  canAdjust: boolean;
}

export function LowStockAlerts({
  initialData,
  onAdjustStock,
  canAdjust,
}: LowStockAlertsProps) {
  const t = useTranslations();
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const { data, refetch, isFetching } = useLowStock(
    { page, limit },
    page === 1 ? initialData : undefined,
    { page: 1, limit: 20 }
  );

  const items = data?.data ?? initialData?.data ?? [];
  const meta = data?.meta ?? initialData?.meta ?? {
    page: 1,
    limit: 20,
    total: items.length,
    totalPages: Math.ceil(items.length / 20) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  return (
    <Card className="border border-border/70 shadow-xs">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4.5 text-amber-500" />
              <span>{t("inventory-low-stock-title") || "Low Stock Alerts"}</span>
            </CardTitle>
            {meta.total > 0 && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {meta.total}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            {t("inventory-low-stock-desc") ||
              "Product variants that have reached or dropped below their replenishment threshold."}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>{t("inventory-btn-refresh") || "Refresh"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <LowStockTable
          items={items}
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={limit}
          onPageChange={setPage}
          onAdjustStock={onAdjustStock}
          canAdjust={canAdjust}
          isLoading={isFetching}
        />
      </CardContent>
    </Card>
  );
}
