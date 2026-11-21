"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  Check,
  Plus,
  Trash2,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useProducts } from "@/features/products/hooks/use-products";
import type { Product, CategoryItem } from "@/features/products";
import { formatBundleCurrency } from "../utils/bundle.util";

interface ProductPickerProps {
  selectedProductIds: string[];
  onSelectionChange: (ids: string[]) => void;
  categories: CategoryItem[];
  initialProducts?: Product[];
  className?: string;
}

export function ProductPicker({
  selectedProductIds,
  onSelectionChange,
  categories,
  initialProducts = [],
  className = "",
}: ProductPickerProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Search & filter state
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);

  // Debounce search input by 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep track of products explicitly selected by user interaction
  const [locallySelectedProducts, setLocallySelectedProducts] = React.useState<Record<string, Product>>({});

  // Query products with pagination & filters
  const { data: queryData, isFetching } = useProducts(
    {
      search: debouncedSearch || undefined,
      category: selectedCategory !== "ALL" ? selectedCategory : undefined,
      page,
      limit: 8,
    },
    page === 1 && !debouncedSearch && selectedCategory === "ALL" && initialProducts.length > 0
      ? {
          success: true,
          statusCode: 200,
          message: "Initial",
          data: initialProducts,
          meta: {
            page: 1,
            limit: 8,
            total: initialProducts.length,
            totalPages: Math.ceil(initialProducts.length / 8) || 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        }
      : undefined
  );

  const products = queryData?.data ?? initialProducts;
  const pagination = queryData?.meta;

  // Selected products dictionary derived purely from initial products, query results, and local interactions
  const selectedProductDetails = React.useMemo(() => {
    const map: Record<string, Product> = { ...locallySelectedProducts };
    for (const p of initialProducts) {
      if (p?._id && !map[p._id]) {
        map[p._id] = p;
      }
    }
    if (queryData?.data) {
      for (const p of queryData.data) {
        if (p?._id && !map[p._id]) {
          map[p._id] = p;
        }
      }
    }
    return map;
  }, [initialProducts, queryData, locallySelectedProducts]);

  // Toggle selection
  const handleToggleProduct = React.useCallback(
    (product: Product) => {
      const isSelected = selectedProductIds.includes(product._id);
      if (isSelected) {
        onSelectionChange(selectedProductIds.filter((id) => id !== product._id));
      } else {
        // Prevent duplicates
        if (!selectedProductIds.includes(product._id)) {
          onSelectionChange([...selectedProductIds, product._id]);
          setLocallySelectedProducts((prev) => ({
            ...prev,
            [product._id]: product,
          }));
        }
      }
    },
    [selectedProductIds, onSelectionChange]
  );

  // Remove one product
  const handleRemoveProduct = React.useCallback(
    (id: string) => {
      onSelectionChange(selectedProductIds.filter((pId) => pId !== id));
    },
    [selectedProductIds, onSelectionChange]
  );

  // Clear all selections
  const handleClearAll = React.useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Calculate total original value of selected products
  const selectedTotalValue = React.useMemo(() => {
    return selectedProductIds.reduce((sum, id) => {
      const p = selectedProductDetails[id];
      if (p) {
        const effectivePrice = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
        return sum + (Number(effectivePrice) || 0);
      }
      return sum;
    }, 0);
  }, [selectedProductIds, selectedProductDetails]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              t("bundle-product-picker-search-placeholder") ||
              "Search products by name or SKU..."
            }
            className="ps-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-56 shrink-0">
          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="text-xs">
              <Filter className="size-3.5 me-2 text-muted-foreground" />
              <SelectValue
                placeholder={
                  t("bundle-product-picker-filter-category") ||
                  "All Categories"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("bundle-product-picker-all-categories") || "All Categories"}
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id} className="text-xs">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Available Products List */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
        <CardHeader className="py-3 px-4 border-b border-border/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {t("bundle-product-picker-available-title") || "Available Products"}
            </span>
          </div>
          {isFetching && (
            <span className="text-[11px] text-muted-foreground animate-pulse">
              {t("bundle-product-picker-loading") || "Searching catalog..."}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {t("bundle-product-picker-no-results") || "No matching products found."}
            </div>
          ) : (
            <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
              {products.map((product) => {
                const isSelected = selectedProductIds.includes(product._id);
                const primaryImage =
                  product.images?.find((img) => img.isPrimary)?.url ||
                  product.images?.[0]?.url;
                const effectivePrice =
                  product.discountPrice && product.discountPrice > 0
                    ? product.discountPrice
                    : product.price;

                return (
                  <div
                    key={product._id}
                    className={`flex items-center justify-between p-3 transition-colors ${
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 me-3">
                      <div className="relative size-11 rounded-md overflow-hidden bg-muted/60 border border-border/80 shrink-0">
                        {primaryImage ? (
                          <Image
                            src={primaryImage}
                            alt={product.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <Package className="size-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {product.name}
                          </p>
                          <Badge variant="outline" dir="ltr" className="text-[10px] px-1 py-0 font-mono">
                            {product.sku}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-foreground">
                            {formatBundleCurrency(effectivePrice, locale)}
                          </span>
                          {product.discountPrice && product.discountPrice > 0 && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatBundleCurrency(product.price, locale)}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            •{" "}
                            {typeof product.category === "object" && product.category !== null && "name" in product.category
                              ? (product.category as { name: string }).name
                              : typeof product.category === "string"
                              ? product.category
                              : t("products-category-general") || "General"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      onClick={() => handleToggleProduct(product)}
                      className="shrink-0 text-xs h-7 px-2.5 gap-1.5"
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{t("bundle-product-picker-btn-selected") || "Selected"}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" />
                          <span>{t("bundle-product-picker-btn-select") || "Select"}</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 text-xs text-muted-foreground">
              <span>
                {t("bundle-table-page") || "Page"} {pagination.page} / {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="size-7 p-0"
                >
                  <ChevronLeft className="size-3.5 rtl:rotate-180" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="size-7 p-0"
                >
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Products Summary */}
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {t("bundle-product-picker-selected-summary") || "Selected Products"}
            </span>
            <Badge variant="secondary" className="text-xs px-2 py-0 font-mono">
              {selectedProductIds.length}
            </Badge>
          </div>

          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t("bundle-product-picker-total-original") || "Catalog Total:"}{" "}
                <strong className="text-foreground font-bold font-mono">
                  {formatBundleCurrency(selectedTotalValue, locale)}
                </strong>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-7 text-muted-foreground hover:text-destructive"
              >
                {t("bundle-product-picker-clear-all") || "Clear All"}
              </Button>
            </div>
          )}
        </div>

        {selectedProductIds.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {t("bundle-product-picker-empty-selected") ||
              "No products selected yet. Select products above to include them in this offer."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedProductIds.map((id) => {
              const product = selectedProductDetails[id];
              const label = product?.name || id;
              const sku = product?.sku ? `(${product.sku})` : "";
              return (
                <div
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border text-foreground shadow-2xs"
                >
                  <span className="max-w-[200px] truncate">{label}</span>
                  {sku && <span dir="ltr" className="text-[10px] text-muted-foreground font-mono">{sku}</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(id)}
                    className="text-muted-foreground hover:text-destructive transition-colors ms-1"
                    title={t("bundle-product-picker-remove") || "Remove"}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
