"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, RotateCcw, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface InventoryMovementsFiltersProps {
  type: string;
  onTypeChange: (val: string) => void;
  sku: string;
  onSkuChange: (val: string) => void;
  sortBy?: string;
  onSortByChange?: (val: string) => void;
  onReset: () => void;
}

export function InventoryMovementsFilters({
  type,
  onTypeChange,
  sku,
  onSkuChange,
  sortBy = "createdAt:desc",
  onSortByChange,
  onReset,
}: InventoryMovementsFiltersProps) {
  // Translation
  const t = useTranslations();

  // State
  const isFiltered =
    type !== "ALL" || sku.trim() !== "" || (sortBy && sortBy !== "createdAt:desc");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search Input for SKU or Product */}
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={sku}
          onChange={(e) => onSkuChange(e.target.value)}
          placeholder={
            t("inventory-filter-search-placeholder") ||
            "Filter by SKU or Product ID..."
          }
          className="ps-9 h-9 text-xs"
        />
      </div>

      {/* Movement Type Filter */}
      <div className="w-full sm:w-48">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="h-9 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <SelectValue
                placeholder={
                  t("inventory-filter-all-types") || "All Movement Types"
                }
              />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              {t("inventory-filter-all-types") || "All Movement Types"}
            </SelectItem>
            <SelectItem value="PURCHASE" className="text-xs">
              {t("inventory-movement-PURCHASE") || "Purchase / Restock"}
            </SelectItem>
            <SelectItem value="SALE" className="text-xs">
              {t("inventory-movement-SALE") || "Sale"}
            </SelectItem>
            <SelectItem value="RETURN" className="text-xs">
              {t("inventory-movement-RETURN") || "Customer Return"}
            </SelectItem>
            <SelectItem value="ADJUSTMENT" className="text-xs">
              {t("inventory-movement-ADJUSTMENT") || "Manual Adjustment"}
            </SelectItem>
            <SelectItem value="DAMAGE" className="text-xs">
              {t("inventory-movement-DAMAGE") || "Damaged / Defect"}
            </SelectItem>
            <SelectItem value="RESERVATION" className="text-xs">
              {t("inventory-movement-RESERVATION") || "Order Reservation"}
            </SelectItem>
            <SelectItem value="RELEASE" className="text-xs">
              {t("inventory-movement-RELEASE") || "Reservation Release"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort By Filter */}
      {onSortByChange && (
        <div className="w-full sm:w-48">
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc" className="text-xs">
                {t("inventory-sort-newest") || "Newest First"}
              </SelectItem>
              <SelectItem value="createdAt:asc" className="text-xs">
                {t("inventory-sort-oldest") || "Oldest First"}
              </SelectItem>
              <SelectItem value="quantityChange:desc" className="text-xs">
                {t("inventory-sort-qty-desc") || "Qty: High to Low"}
              </SelectItem>
              <SelectItem value="quantityChange:asc" className="text-xs">
                {t("inventory-sort-qty-asc") || "Qty: Low to High"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reset Button */}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
        >
          <RotateCcw className="size-3.5" />
          <span>{t("inventory-filter-reset") || "Reset"}</span>
        </Button>
      )}
    </div>
  );
}
