"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  FolderTree,
  Table as TableIcon,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { CategoryFilters, CategoryViewMode } from "../types/category.types";

interface CategoriesHeaderProps {
  filters: CategoryFilters;
  onFiltersChange: (newFilters: Partial<CategoryFilters>) => void;
  viewMode: CategoryViewMode;
  onViewModeChange: (mode: CategoryViewMode) => void;
  canCreate: boolean;
}

export function CategoriesHeader({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  canCreate,
}: CategoriesHeaderProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      {/* Top row: Title & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderTree className="size-6 text-primary" />
            {t("categories-title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            {t("categories-desc")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/40">
            <Button
              type="button"
              variant={viewMode === "tree" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("tree")}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-md"
              title={t("categories-view-tree")}
            >
              <FolderTree className="size-3.5" />
              <span className="hidden md:inline">{t("categories-view-tree")}</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-md"
              title={t("categories-view-table")}
            >
              <TableIcon className="size-3.5" />
              <span className="hidden md:inline">{t("categories-view-table")}</span>
            </Button>
          </div>

          {canCreate && (
            <Button asChild size="sm" className="h-9 gap-1.5 text-xs font-medium">
              <Link href="/admin/categories/new">
                <Plus className="size-3.5" />
                <span>{t("categories-btn-add")}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card/60 p-3 rounded-xl border border-border/60 backdrop-blur-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Input
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            placeholder={t("categories-search-placeholder")}
            className="ps-9 h-9 text-xs w-full bg-background/80"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) =>
                onFiltersChange({ status: val as CategoryFilters["status"] })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="size-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  {t("categories-filter-status-all")}
                </SelectItem>
                <SelectItem value="active" className="text-xs">
                  {t("categories-filter-status-active")}
                </SelectItem>
                <SelectItem value="inactive" className="text-xs">
                  {t("categories-filter-status-inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="w-40">
            <Select
              value={filters.type || "all"}
              onValueChange={(val) =>
                onFiltersChange({ type: val as CategoryFilters["type"] })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  {t("categories-filter-type-all")}
                </SelectItem>
                <SelectItem value="root" className="text-xs">
                  {t("categories-filter-type-root")}
                </SelectItem>
                <SelectItem value="sub" className="text-xs">
                  {t("categories-filter-type-sub")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
