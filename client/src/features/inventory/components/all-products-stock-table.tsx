"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Boxes,
  Search,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { StockStatusBadge } from "./stock-status-badge";
import { useProducts } from "@/features/products/hooks/use-products";
import {
  getProductStockStatus,
  getPrimaryImageUrl,
} from "@/features/products/utils/product.util";
import type {
  Product,
  ProductVariantItem,
  ProductsPaginatedResponse,
} from "@/features/products/types/product.types";
import type { LowStockItem } from "../types/inventory.types";

interface AllProductsStockTableProps {
  initialData?: ProductsPaginatedResponse;
  onAdjustStock: (item: LowStockItem) => void;
  canAdjust: boolean;
}

export function AllProductsStockTable({
  initialData,
  onAdjustStock,
  canAdjust,
}: AllProductsStockTableProps) {
  // Localization
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  // State
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [stockStatus, setStockStatus] = React.useState<string>("ALL");
  const [expandedProducts, setExpandedProducts] = React.useState<Record<string, boolean>>({});

  const limit = 20;

  // Search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query
  const { data, refetch, isFetching } = useProducts(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      stockStatus: stockStatus !== "ALL" ? (stockStatus as any) : undefined,
      admin: true,
    },
    page === 1 && !debouncedSearch && stockStatus === "ALL" ? initialData : undefined,
    { page: 1, limit: 20 }
  );

  const products: Product[] = data?.data ?? initialData?.data ?? [];
  const meta = data?.meta ?? initialData?.meta ?? {
    page: 1,
    limit: 20,
    total: products.length,
    totalPages: Math.ceil(products.length / 20) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(isAr ? "ar-EG" : "en-US");
  }, [isAr]);

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, meta.total);

  // Toggle variant expansion for long variant lists
  function toggleExpanded(productId: string) {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  }

  // Create LowStockItem adapter for the stock adjustment dialog
  function createAdjustmentTarget(product: Product, variant?: ProductVariantItem): LowStockItem {
    const targetVariant = variant || product.variants[0];
    const categoryName =
      typeof product.category === "object" && product.category !== null
        ? product.category.name
        : typeof product.category === "string"
        ? product.category
        : "";

    return {
      productId: product._id,
      productName: product.name,
      productSku: product.sku,
      category: categoryName,
      variantSku: targetVariant?.sku || product.sku,
      color: targetVariant?.color || "",
      size: targetVariant?.size || "",
      stockQuantity: targetVariant?.stockQuantity ?? product.totalStock,
      threshold: product.lowStockThreshold || 5,
    };
  }

  function handleAdjustVariant(product: Product, variant: ProductVariantItem) {
    if (!canAdjust) return;
    onAdjustStock(createAdjustmentTarget(product, variant));
  }

  function handleAdjustProduct(product: Product) {
    if (!canAdjust) return;
    onAdjustStock(createAdjustmentTarget(product));
  }

  return (
    <Card className="border border-border/70 shadow-xs">
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Boxes className="size-4.5 text-primary" />
                <span>
                  {t("inventory-all-products-title") || "All Warehouse Products Stock"}
                </span>
              </CardTitle>
              {meta.total > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {numberFormatter.format(meta.total)}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {t("inventory-all-products-desc") ||
                "Comprehensive overview of all products and variants in the warehouse with stock quantities and status."}
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>{t("inventory-btn-refresh") || "Refresh"}</span>
          </Button>
        </div>

        {/* Search & Stock Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                t("inventory-search-products-ph") || "Search by product name or SKU..."
              }
              className="ps-9 pe-9 h-9 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Stock Status Filter */}
          <div className="w-full sm:w-52">
            <Select
              value={stockStatus}
              onValueChange={(val) => {
                setStockStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue
                    placeholder={t("inventory-filter-all-statuses") || "All Stock Statuses"}
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  {t("inventory-filter-all-statuses") || "All Stock Statuses"}
                </SelectItem>
                <SelectItem value="IN_STOCK" className="text-xs">
                  {t("inventory-status-in-stock") || "In Stock"}
                </SelectItem>
                <SelectItem value="LOW_STOCK" className="text-xs">
                  {t("inventory-status-low-stock") || "Low Stock"}
                </SelectItem>
                <SelectItem value="OUT_OF_STOCK" className="text-xs">
                  {t("inventory-status-out-of-stock") || "Out of Stock"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Empty State */}
        {!isFetching && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
              {t("inventory-all-products-empty-title") || "No warehouse products found"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("inventory-all-products-empty-desc") ||
                "No products match the selected filters or search keyword."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-start min-w-[220px]">
                    {t("inventory-col-product") || "Product"}
                  </TableHead>
                  <TableHead className="text-center min-w-[130px]">
                    {t("inventory-col-total-stock") || "Total Stock"}
                  </TableHead>
                  <TableHead className="text-center min-w-[100px]">
                    {t("inventory-col-status") || "Status"}
                  </TableHead>
                  <TableHead className="text-start min-w-[320px]">
                    {t("inventory-col-variants-breakdown") || "Variants Breakdown (Size / Color)"}
                  </TableHead>
                  <TableHead className="text-end min-w-[130px]">
                    {t("inventory-col-actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product) => {
                  const status = getProductStockStatus(product);
                  const imageUrl = getPrimaryImageUrl(product.images);
                  const isExpanded = !!expandedProducts[product._id];
                  const variants = product.variants || [];
                  const displayedVariants = isExpanded ? variants : variants.slice(0, 4);
                  const hiddenCount = Math.max(0, variants.length - 4);
                  const categoryName =
                    typeof product.category === "object" && product.category !== null
                      ? product.category.name
                      : typeof product.category === "string"
                      ? product.category
                      : "";

                  return (
                    <TableRow
                      key={product._id}
                      className="hover:bg-muted/30 transition-colors align-top"
                    >
                      {/* Product Details */}
                      <TableCell className="text-start py-3">
                        <div className="flex items-start gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-muted-foreground">
                                <Package className="size-5" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/admin/products/${product._id}`}
                              className="font-semibold text-xs sm:text-sm text-foreground hover:underline line-clamp-1 flex items-center gap-1"
                              title={product.name}
                            >
                              <span>{product.name}</span>
                              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                            </Link>

                            <div className="flex items-center gap-2 mt-1">
                              {categoryName && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[11px] text-muted-foreground">
                                  {categoryName}
                                </span>
                              )}
                              <bdi className="font-mono text-[11px] text-muted-foreground">
                                SKU: {product.sku}
                              </bdi>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Total Stock */}
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`font-mono text-base font-bold ${
                              product.totalStock === 0
                                ? "text-destructive"
                                : product.totalStock <= (product.lowStockThreshold || 5)
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {numberFormatter.format(product.totalStock)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {t("inventory-units") || "units"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell className="text-center py-3">
                        <StockStatusBadge status={status} />
                      </TableCell>

                      {/* Variant Breakdown */}
                      <TableCell className="text-start py-3">
                        {variants.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">
                            {t("inventory-no-variants") || "No variants registered"}
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              {displayedVariants.map((variant) => {
                                const isZero = variant.stockQuantity === 0;
                                const isLow =
                                  variant.stockQuantity > 0 &&
                                  variant.stockQuantity <= (product.lowStockThreshold || 5);

                                return (
                                  <div
                                    key={variant.sku}
                                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                                      isZero
                                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                                        : isLow
                                        ? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
                                        : "border-border/70 bg-muted/40 text-foreground"
                                    }`}
                                  >
                                    {/* Variant Color & Size */}
                                    <span className="font-medium">
                                      {variant.color} / {variant.size}
                                    </span>

                                    {/* Stock Quantity */}
                                    <span
                                      className={`font-mono font-bold px-1 rounded ${
                                        isZero
                                          ? "bg-destructive/10 text-destructive"
                                          : isLow
                                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                          : "bg-background text-foreground"
                                      }`}
                                    >
                                      {numberFormatter.format(variant.stockQuantity)}
                                    </span>

                                    {/* Reserved quantity if any */}
                                    {variant.reservedQuantity && variant.reservedQuantity > 0 ? (
                                      <span
                                        className="text-[10px] text-muted-foreground font-mono"
                                        title={`${t("inventory-col-reserved") || "Reserved"}: ${variant.reservedQuantity}`}
                                      >
                                        ({t("inventory-col-reserved") || "Res"}: {variant.reservedQuantity})
                                      </span>
                                    ) : null}

                                    {/* Quick adjust icon per variant */}
                                    {canAdjust && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdjustVariant(product, variant)}
                                        title={`${t("inventory-adjust-variant-btn") || "Adjust"}: ${variant.sku}`}
                                        className="ms-1 p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-background/80 transition-colors"
                                      >
                                        <SlidersHorizontal className="size-3" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Expand/Collapse Toggle */}
                            {variants.length > 4 && (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(product._id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline pt-0.5"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="size-3" />
                                    <span>{t("inventory-variants-less") || "Show less"}</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="size-3" />
                                    <span>
                                      {t("inventory-variants-more", { count: hiddenCount }) ||
                                        `+${hiddenCount} more variants`}
                                    </span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-end py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAdjust && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustProduct(product)}
                              className="h-8 gap-1.5 text-xs font-medium border-border/80 hover:bg-muted"
                            >
                              <SlidersHorizontal className="size-3.5" />
                              <span className="hidden sm:inline">
                                {t("inventory-btn-adjust") || "Adjust Stock"}
                              </span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Link
                              href={`/admin/products/${product._id}`}
                              title={t("inventory-view-product") || "View Product"}
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-muted-foreground">
              {t("inventory-pagination-showing", {
                start: numberFormatter.format(startRecord),
                end: numberFormatter.format(endRecord),
                total: numberFormatter.format(meta.total),
              }) || `Showing ${startRecord} to ${endRecord} of ${meta.total} records`}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                {numberFormatter.format(page)} / {numberFormatter.format(meta.totalPages)}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
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
      </CardContent>
    </Card>
  );
}
