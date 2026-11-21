"use client";

// TanStack Table returns non-memoizable functions; React Compiler skips memoizing this component as intended.
/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit2,
  Archive,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FilterX,
  X,
  Loader2,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  formatCurrency,
  formatProductDate,
  getProductStockStatus,
  getProductStatusBadgeVariant,
  getPrimaryImageUrl,
} from "../../utils/product.util";
import type {
  Product,
  ProductFilters,
  PaginationMeta,
  CategoryItem,
} from "../../types/product.types";
import type { SafeUser } from "@/lib/auth/types";

interface ProductsTableProps {
  products: Product[];
  pagination?: PaginationMeta;
  filters: ProductFilters;
  categories: CategoryItem[];
  onFilterChange: (filters: Partial<ProductFilters>) => void;
  currentUser: SafeUser | null;
  locale: string;
  isFetching?: boolean;
  onArchive: (product: Product) => void;
}

export function ProductsTable({
  products,
  pagination,
  filters,
  categories,
  onFilterChange,
  currentUser,
  locale,
  isFetching,
  onArchive,
}: ProductsTableProps) {
  const t = useTranslations();
  const [searchInput, setSearchInput] = React.useState(filters.search ?? "");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastCommittedSearchRef = React.useRef(filters.search ?? "");

  React.useEffect(() => {
    const currentPropSearch = filters.search ?? "";
    if (currentPropSearch !== lastCommittedSearchRef.current) {
      lastCommittedSearchRef.current = currentPropSearch;
      setSearchInput(currentPropSearch);
    }
  }, [filters.search]);

  const canUpdate = can(
    currentUser?.role,
    PERMISSIONS.PRODUCTS_UPDATE,
    currentUser?.permissions
  );

  const canArchive = can(
    currentUser?.role,
    PERMISSIONS.PRODUCTS_ARCHIVE,
    currentUser?.permissions
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      lastCommittedSearchRef.current = value;
      onFilterChange({
        search: value.trim() || undefined,
        page: 1,
      });
    }, 350);
  }

  function handleClearSearch() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput("");
    lastCommittedSearchRef.current = "";
    onFilterChange({
      search: undefined,
      page: 1,
    });
  }

  function handleCategoryChange(value: string) {
    onFilterChange({
      category: value === "ALL" ? undefined : value,
      page: 1,
    });
  }

  function handleStatusChange(value: string) {
    onFilterChange({
      status: value === "ALL" ? undefined : (value as ProductFilters["status"]),
      page: 1,
    });
  }

  function handleSortToggle(field: string) {
    const currentSort = filters.sortBy;
    let nextSort: string | undefined;

    if (currentSort === `${field}:asc`) {
      nextSort = `${field}:desc`;
    } else if (currentSort === `${field}:desc`) {
      nextSort = undefined;
    } else {
      nextSort = `${field}:asc`;
    }

    onFilterChange({
      sortBy: nextSort,
      page: 1,
    });
  }

  function handleResetFilters() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput("");
    lastCommittedSearchRef.current = "";
    onFilterChange({
      search: undefined,
      category: undefined,
      status: undefined,
      sortBy: undefined,
      page: 1,
    });
  }

  const renderSortHeader = (label: string, field: string) => {
    const isAsc = filters.sortBy === `${field}:asc`;
    const isDesc = filters.sortBy === `${field}:desc`;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSortToggle(field)}
        className="-ms-3 h-8 text-xs font-semibold hover:bg-muted/50 data-[state=open]:bg-accent"
      >
        <span>{label}</span>
        {isAsc ? (
          <ArrowUp className="ms-1.5 size-3.5 text-primary" />
        ) : isDesc ? (
          <ArrowDown className="ms-1.5 size-3.5 text-primary" />
        ) : (
          <ArrowUpDown className="ms-1.5 size-3.5 text-muted-foreground/60" />
        )}
      </Button>
    );
  };

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "product",
        header: () => renderSortHeader(t("products-col-product"), "name"),
        cell: ({ row }) => {
          const product = row.original;
          const imageUrl = getPrimaryImageUrl(product.images);
          return (
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/products/${product._id}`}
                  className="font-medium text-xs text-foreground hover:text-primary transition-colors truncate block"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    /{product.slug}
                  </span>
                  {product.brand && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                      {product.brand}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "sku",
        header: t("products-col-sku"),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-foreground tracking-wide ltr-inline">
            {row.original.sku}
          </span>
        ),
      },
      {
        id: "category",
        header: t("products-col-category"),
        cell: ({ row }) => {
          const cat = row.original.category;
          const catName = typeof cat === "object" && cat !== null ? cat.name : "-";
          return (
            <Badge variant="secondary" className="text-[11px] font-normal">
              {catName}
            </Badge>
          );
        },
      },
      {
        id: "price",
        header: () => renderSortHeader(t("products-col-price"), "price"),
        cell: ({ row }) => {
          const p = row.original;
          const hasDiscount = p.discountPrice && p.discountPrice < p.price;
          return (
            <div className="flex flex-col text-xs font-mono">
              {hasDiscount ? (
                <>
                  <span className="font-bold text-foreground">
                    {formatCurrency(p.discountPrice!, locale)}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatCurrency(p.price, locale)}
                  </span>
                </>
              ) : (
                <span className="font-medium text-foreground">
                  {formatCurrency(p.price, locale)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "stock",
        header: () => renderSortHeader(t("products-col-stock"), "totalStock"),
        cell: ({ row }) => {
          const p = row.original;
          const stockStatus = getProductStockStatus(p);
          let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
          let labelKey = "products-filter-in-stock";

          if (stockStatus === "OUT_OF_STOCK") {
            badgeVariant = "destructive";
            labelKey = "products-filter-out-of-stock";
          } else if (stockStatus === "LOW_STOCK") {
            badgeVariant = "secondary";
            labelKey = "products-filter-low-stock";
          }

          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-foreground">
                {p.totalStock}
              </span>
              <Badge variant={badgeVariant} className="text-[10px] py-0 px-1 font-normal">
                {t(labelKey)}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "variants",
        header: t("products-col-variants"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.variants?.length || 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("products-col-status"),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={getProductStatusBadgeVariant(status)}
              className="text-[10px] font-normal"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: () => renderSortHeader(t("products-col-created"), "createdAt"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {formatProductDate(row.original.createdAt, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("products-col-actions")}</span>,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">{t("products-col-actions")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/admin/products/${product._id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>{t("products-action-view")}</span>
                  </Link>
                </DropdownMenuItem>

                {canUpdate && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit2 className="size-3.5 text-muted-foreground" />
                      <span>{t("products-action-edit")}</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <a
                    href={`/${locale}/products/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                    <span>{t("products-action-storefront")}</span>
                  </a>
                </DropdownMenuItem>

                {canArchive && product.status !== "ARCHIVED" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onArchive(product)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Archive className="size-3.5" />
                      <span>{t("products-action-archive")}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.sortBy, categories, locale, canUpdate, canArchive, t]
  );

  // Column label mapping for visibility toggle
  const columnLabels: Record<string, string> = {
    product: t("products-col-product"),
    sku: t("products-col-sku"),
    category: t("products-col-category"),
    price: t("products-col-price"),
    stock: t("products-col-stock"),
    variants: t("products-col-variants"),
    status: t("products-col-status"),
    createdAt: t("products-col-created"),
  };

  const table = useReactTable({
    data: products,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.category ||
    filters.status ||
    filters.sortBy
  );

  const currentPage = pagination?.page ?? filters.page ?? 1;
  const currentLimit = pagination?.limit ?? filters.limit ?? 20;
  const totalItems = pagination?.total ?? products.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / currentLimit));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, totalItems);

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-xs shadow-xs overflow-hidden">
      {/* ─── Table Controls Header ─── */}
      <div className="flex flex-col gap-3 p-4 border-b border-border/40 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={t("products-search-placeholder")}
            className="ps-9 pe-8 h-9 text-xs bg-background/80 border-border/60"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Column Visibility Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select
            value={filters.category || "ALL"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="h-9 w-full sm:w-40 text-xs border-border/60">
              <SelectValue placeholder={t("products-filter-category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("products-filter-all-categories")}
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || "ALL"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-9 w-full sm:w-36 text-xs border-border/60">
              <SelectValue placeholder={t("products-filter-status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("products-filter-all-statuses")}
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">
                ACTIVE
              </SelectItem>
              <SelectItem value="DRAFT" className="text-xs">
                DRAFT
              </SelectItem>
              <SelectItem value="ARCHIVED" className="text-xs">
                ARCHIVED
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Columns Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs border-border/60 gap-1.5"
              >
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span>{t("products-columns-toggle")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((column) => column.id !== "actions" && column.id in columnLabels)
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-xs capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-3.5" />
              <span>{t("products-filter-reset")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Table Content ─── */}
      <div className="relative">
        {isFetching && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="size-6 text-primary animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border/60">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border/40 transition-colors hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center text-xs text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                        <Package className="size-6" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {t("products-empty-title")}
                      </p>
                      <p className="text-xs max-w-sm text-muted-foreground">
                        {t("products-empty-desc")}
                      </p>
                      {hasActiveFilters ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs gap-1.5"
                        >
                          <FilterX className="size-3.5" />
                          <span>{t("products-filter-reset")}</span>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                        >
                          <Link href="/admin/products/new">
                            {t("products-empty-create")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Table Pagination Footer ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div>
            {t("products-pagination-showing", {
              start: startItem,
              end: endItem,
              total: totalItems,
            })}
          </div>

          {/* Page Size Selection */}
          <div className="flex items-center gap-1.5">
            <span>{t("products-pagination-rows-per-page")}:</span>
            <Select
              value={String(currentLimit)}
              onValueChange={(val) => onFilterChange({ limit: Number(val), page: 1 })}
            >
              <SelectTrigger className="h-7 w-16 text-xs border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterChange({ page: Math.max(1, currentPage - 1) })}
            disabled={currentPage <= 1 || isFetching}
            className="h-8 text-xs gap-1"
          >
            <ChevronLeft className="size-3.5 rtl:rotate-180" />
            <span>{t("products-pagination-prev")}</span>
          </Button>

          <span className="px-2 font-mono text-xs">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterChange({ page: currentPage + 1 })}
            disabled={currentPage >= totalPages || isFetching}
            className="h-8 text-xs gap-1"
          >
            <span>{t("products-pagination-next")}</span>
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
