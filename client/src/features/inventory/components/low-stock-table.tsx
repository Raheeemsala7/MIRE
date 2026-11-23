"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ExternalLink,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { StockStatusBadge } from "./stock-status-badge";
import { determineStockStatus, calculateReplenishmentUnits } from "../utils/inventory.util";
import type { LowStockItem } from "../types/inventory.types";

interface LowStockTableProps {
  items: LowStockItem[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onAdjustStock: (item: LowStockItem) => void;
  canAdjust: boolean;
  isLoading?: boolean;
}

export function LowStockTable({
  items,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onAdjustStock,
  canAdjust,
  isLoading = false,
}: LowStockTableProps) {
  // Localization
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  // Formatter
  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(isAr ? "ar-EG" : "en-US");
  }, [isAr]);

  // Variables
  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Package className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          {t("inventory-low-stock-empty-title") || "All stock levels healthy"}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("inventory-low-stock-empty-desc") ||
            "No variants currently need replenishment."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container with horizontal scroll on small viewports */}
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-start min-w-[200px]">{t("inventory-col-product") || "Product"}</TableHead>
              <TableHead className="text-start min-w-[130px]">{t("inventory-col-variant") || "Variant"}</TableHead>
              <TableHead className="text-start min-w-[140px]">{t("inventory-col-sku") || "SKU"}</TableHead>
              <TableHead className="text-center min-w-[110px]">{t("inventory-col-current-stock") || "Current Stock"}</TableHead>
              <TableHead className="text-center min-w-[100px]">{t("inventory-col-threshold") || "Threshold"}</TableHead>
              <TableHead className="text-center min-w-[110px]">{t("inventory-col-status") || "Status"}</TableHead>
              <TableHead className="text-center min-w-[160px]">{t("inventory-col-replenish") || "Replenishment Needed"}</TableHead>
              <TableHead className="text-end min-w-[130px]">{t("inventory-col-actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const status = determineStockStatus(item.stockQuantity, item.threshold);
              return (
                <TableRow
                  key={`${item.productId}-${item.variantSku}-${index}`}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* Product Details */}
                  <TableCell className="font-medium text-start">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground line-clamp-1">
                        {item.productName}
                      </span>
                      {item.category && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Variant Details */}
                  <TableCell className="text-start">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-foreground">
                        {item.color}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono" dir="ltr">
                        {item.size}
                      </span>
                    </div>
                  </TableCell>

                  {/* Variant SKU */}
                  <TableCell className="text-start">
                    <bdi dir="ltr" className="font-mono text-xs text-muted-foreground select-all inline-block">
                      {item.variantSku}
                    </bdi>
                  </TableCell>

                  {/* Stock Quantity */}
                  <TableCell className="text-center">
                    <span
                      dir="ltr"
                      className={`font-mono text-sm font-semibold inline-block ${
                        item.stockQuantity === 0
                          ? "text-destructive font-bold"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {numberFormatter.format(item.stockQuantity)}
                    </span>
                  </TableCell>

                  {/* Low Stock Threshold */}
                  <TableCell className="text-center">
                    <span dir="ltr" className="font-mono text-xs text-muted-foreground inline-block">
                      {numberFormatter.format(item.threshold)}
                    </span>
                  </TableCell>

                  {/* Stock Status Badge */}
                  <TableCell className="text-center">
                    <StockStatusBadge status={status} />
                  </TableCell>

                  {/* Replenishment Requirement */}
                  <TableCell className="text-center">
                    {(() => {
                      const unitsNeeded = calculateReplenishmentUnits(
                        item.stockQuantity,
                        item.threshold
                      );
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            item.stockQuantity === 0
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                              : "bg-amber-500/10 text-emerald-600 dark:text-emerald-400 border border-amber-500/20"
                          }`}
                        >
                          <span dir="ltr" className="font-mono">
                            +{numberFormatter.format(unitsNeeded)}
                          </span>
                          <span>{t("inventory-units") || "units"}</span>
                        </span>
                      );
                    })()}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Link
                          href={`/admin/products/${item.productId}`}
                          title={t("inventory-view-product") || "View Product"}
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>

                      {canAdjust && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAdjustStock(item)}
                          className="h-8 gap-1.5 text-xs font-medium border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-muted-foreground dark:text-muted-foreground"
                        >
                          <SlidersHorizontal className="size-3.5 shrink-0" />
                          <span>{t("inventory-btn-adjust") || "Adjust Stock"}</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            {t("inventory-pagination-showing", {
              start: numberFormatter.format(startRecord),
              end: numberFormatter.format(endRecord),
              total: numberFormatter.format(total),
            }) || `Showing ${startRecord} to ${endRecord} of ${total} records`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 gap-1 text-xs"
            >
              {isAr ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronLeft className="size-3.5" />
              )}
              <span>{t("inventory-pagination-prev") || "Previous"}</span>
            </Button>

            <span className="text-xs text-muted-foreground px-2">
              {numberFormatter.format(page)} / {numberFormatter.format(totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8 gap-1 text-xs"
            >
              <span>{t("inventory-pagination-next") || "Next"}</span>
              {isAr ? (
                <ChevronLeft className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
