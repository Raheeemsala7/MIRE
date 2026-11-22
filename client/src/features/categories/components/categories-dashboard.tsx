"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { CategoriesHeader } from "./categories-header";
import { CategoriesOverview } from "./categories-overview";
import { CategoriesTree } from "./categories-tree";
import { CategoriesTable } from "./categories-table";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import type {
  CategoryItem,
  CategoryTreeNode,
  CategoryOverviewStats,
  CategoryFilters,
  CategoryViewMode,
} from "../types/category.types";
import {
  buildCategoryTree,
  filterCategories,
} from "../utils/category.util";

interface CategoriesDashboardProps {
  initialCategories: CategoryItem[];
  initialTree?: CategoryTreeNode[];
  stats: CategoryOverviewStats;
  canWrite: boolean;
  locale: string;
}

export function CategoriesDashboard({
  initialCategories,
  initialTree,
  stats,
  canWrite,
  locale,
}: CategoriesDashboardProps) {
  const router = useRouter();
  const isAr = locale === "ar";

  const [viewMode, setViewMode] = React.useState<CategoryViewMode>("tree");
  const [filters, setFilters] = React.useState<CategoryFilters>({
    search: "",
    status: "all",
    type: "all",
  });

  const [deleteTarget, setDeleteTarget] = React.useState<CategoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleFiltersChange = React.useCallback(
    (newFilters: Partial<CategoryFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const handleDeleteRequest = React.useCallback((category: CategoryItem) => {
    setDeleteTarget(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteSuccess = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      (filters.status && filters.status !== "all") ||
      (filters.type && filters.type !== "all")
  );

  // Memoize filtered dataset to prevent expensive re-filtering
  const filteredCategories = React.useMemo(() => {
    if (!hasActiveFilters) return initialCategories;
    return filterCategories(initialCategories, filters);
  }, [initialCategories, filters, hasActiveFilters]);

  // Use server-constructed initial tree when no filters are active; otherwise build filtered tree
  const categoryTree = React.useMemo(() => {
    if (!hasActiveFilters && initialTree) {
      return initialTree;
    }
    return buildCategoryTree(filteredCategories);
  }, [filteredCategories, hasActiveFilters, initialTree]);

  return (
    <div className="space-y-6">
      {/* 1. Header with title, view switcher, search & filters */}
      <CategoriesHeader
        filters={filters}
        onFiltersChange={handleFiltersChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canCreate={canWrite}
      />

      {/* 2. Overview metrics cards */}
      <CategoriesOverview stats={stats} />

      {/* 3. Main content area: Tree or Table view */}
      {viewMode === "tree" ? (
        <CategoriesTree
          tree={categoryTree}
          allCategories={initialCategories}
          onDeleteRequest={handleDeleteRequest}
          canWrite={canWrite}
          isAr={isAr}
        />
      ) : (
        <CategoriesTable
          categories={filteredCategories}
          allCategories={initialCategories}
          onDeleteRequest={handleDeleteRequest}
          canWrite={canWrite}
          isAr={isAr}
        />
      )}

      {/* 4. Delete confirmation modal */}
      <DeleteCategoryDialog
        category={deleteTarget}
        allCategories={initialCategories}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
