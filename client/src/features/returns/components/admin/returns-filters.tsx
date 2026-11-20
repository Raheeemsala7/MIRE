"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, RotateCcw, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ReturnsFilterParams } from "../../types/return.types";
import { RETURN_STATUSES } from "../../types/return.types";
import { STATUS_CONFIG } from "../../utils/return.util";

interface ReturnsFiltersProps {
  filters: ReturnsFilterParams;
  onFilterChange: (newFilters: Partial<ReturnsFilterParams>) => void;
  onReset: () => void;
  locale?: string;
  isPending?: boolean;
}

export const ReturnsFilters = React.memo(function ReturnsFilters({
  filters,
  onFilterChange,
  onReset,
  locale = "en",
  isPending = false,
}: ReturnsFiltersProps) {
  const t = useTranslations();
  const isAr = locale === "ar";
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setSearchTerm(filters.search || "");
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        startTransition(() => {
          onFilterChange({ search: searchTerm, page: 1 });
        });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onFilterChange]);

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) ||
    (filters.status && filters.status !== "ALL") ||
    filters.assignedEmployee
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              t("returns-search-placeholder") ||
              "Search by return # (e.g. RET-2026-0001)..."
            }
            className="ps-9 pe-9 h-9.5 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status dropdown */}
        <div className="w-full sm:w-56">
          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) => {
              onFilterChange({ status: val === "ALL" ? undefined : val, page: 1 });
            }}
          >
            <SelectTrigger className="h-9.5 text-sm">
              <div className="flex items-center gap-2">
                <Filter className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder={t("returns-filter-status") || "Filter by status"} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("returns-filter-all-statuses") || "All Statuses"}
              </SelectItem>
              {Object.values(RETURN_STATUSES).map((status) => {
                const cfg = STATUS_CONFIG[status];
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${cfg.dotClass}`} />
                      <span>{isAr ? cfg.labelAr : cfg.labelEn}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reset button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isPending}
          className="h-9.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          <span>{t("returns-filter-reset") || "Reset Filters"}</span>
        </Button>
      )}
    </div>
  );
});
