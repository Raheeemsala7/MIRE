import type { CategoryItem, CategoriesResponse } from "@/features/products/types/product.types";

export type { CategoryItem, CategoriesResponse };

/**
 * Single Category API Response structure
 */
export interface SingleCategoryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CategoryItem;
}

/**
 * Server Action result payload
 */
export interface CategoryActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Hierarchical Category Tree Node
 */
export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
  depth: number;
  subcategoriesCount: number;
}

/**
 * Overview statistics derived from verified categories list
 */
export interface CategoryOverviewStats {
  totalCategories: number;
  parentCategories: number;
  subcategories: number;
  activeCategories: number;
}

/**
 * Client filters for categories dashboard
 */
export interface CategoryFilters {
  search?: string;
  status?: "all" | "active" | "inactive";
  type?: "all" | "root" | "sub";
}

/**
 * Dashboard presentation mode
 */
export type CategoryViewMode = "tree" | "table";
