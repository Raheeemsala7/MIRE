"use client";

// TanStack Table returns non-memoizable functions; React Compiler skips memoizing this component as intended.
/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  History,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  User,
  ShoppingBag,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { MovementTypeBadge } from "./stock-status-badge";
import { InventoryMovementsFilters } from "./inventory-movements-filters";
import { useInventoryMovements } from "../hooks/use-inventory-movements";
import {
  formatQuantityChange,
  formatInventoryDate,
} from "../utils/inventory.util";
import type {
  InventoryMovementItem,
  InventoryMovementsPaginatedResponse,
} from "../types/inventory.types";

interface InventoryMovementsTableProps {
  initialData?: InventoryMovementsPaginatedResponse;
}

export function InventoryMovementsTable({
  initialData,
}: InventoryMovementsTableProps) {
  // Translation
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  // State
  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState<string>("ALL");
  const [skuInput, setSkuInput] = React.useState<string>("");
  const [debouncedSku, setDebouncedSku] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<string>("createdAt:desc");
  const limit = 20;

  // Effects
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSku(skuInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [skuInput]);

  // Queries
  const { data, refetch, isFetching } = useInventoryMovements(
    {
      page,
      limit,
      type: type !== "ALL" ? type : undefined,
      variantSku: debouncedSku || undefined,
      sortBy,
    },
    page === 1 && type === "ALL" && !debouncedSku && sortBy === "createdAt:desc"
      ? initialData
      : undefined,
    { page: 1, limit: 20 }
  );

  const movements = data?.data ?? initialData?.data ?? [];
  const meta = data?.meta ?? initialData?.meta ?? {
    page: 1,
    limit: 20,
    total: movements.length,
    totalPages: Math.ceil(movements.length / 20) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(isAr ? "ar-EG" : "en-US");
  }, [isAr]);

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, meta.total);

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<InventoryMovementItem>[]>(() => {
    return [
      {
        id: "id",
        header: () => (
          <span className="text-start">
            {t("inventory-col-id") || "Movement ID"}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const shortId = item._id.slice(-6);
          return (
            <span
              className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
              title={item._id}
            >
              #{shortId}
            </span>
          );
        },
      },
      {
        id: "date",
        header: () => (
          <span className="text-start">
            {t("inventory-col-date") || "Date & Time"}
          </span>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground font-mono">
            {formatInventoryDate(row.original.createdAt, locale)}
          </span>
        ),
      },
      {
        id: "product",
        header: () => (
          <span className="text-start">
            {t("inventory-col-product") || "Product"}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const productObj =
            typeof item.product === "object" && item.product !== null
              ? item.product
              : null;
          const productName = productObj ? productObj.name : "Product";
          const productId = productObj ? productObj._id : typeof item.product === "string" ? item.product : undefined;
          const primaryImage =
            productObj && productObj.images && productObj.images.length > 0
              ? productObj.images.find((img) => img.isPrimary)?.url ||
                productObj.images[0].url
              : null;

          return (
            <div className="flex items-center gap-2 max-w-[200px]">
              {primaryImage ? (
                <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  <Image
                    src={primaryImage}
                    alt={productName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                  <Package className="size-4" />
                </div>
              )}
              {productId ? (
                <Link
                  href={`/admin/products/${productId}`}
                  className="hover:underline flex items-center gap-1 font-semibold text-foreground text-xs truncate"
                  title={productName}
                >
                  <span className="truncate">{productName}</span>
                  <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                </Link>
              ) : (
                <span className="text-xs font-semibold text-foreground truncate" title={productName}>
                  {productName}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "variant",
        header: () => (
          <span className="text-start">
            {t("inventory-col-variant") || "Variant / SKU"}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap">
              <bdi className="font-mono text-xs text-foreground font-medium">
                {item.variantSku}
              </bdi>
              <span className="text-[11px] text-muted-foreground">
                {item.color} / {item.size}
              </span>
            </div>
          );
        },
      },
      {
        id: "type",
        header: () => (
          <span className="text-center block">
            {t("inventory-col-type") || "Type"}
          </span>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <MovementTypeBadge type={row.original.type} />
          </div>
        ),
      },
      {
        id: "quantityChange",
        header: () => (
          <span className="text-center block">
            {t("inventory-col-change") || "Change"}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isPositive = item.quantityChange > 0;
          return (
            <div className="text-center">
              <bdi
                className={`font-semibold text-xs px-2 py-0.5 rounded ${
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                }`}
              >
                {formatQuantityChange(item.quantityChange, locale)}
              </bdi>
            </div>
          );
        },
      },
      {
        id: "previousStock",
        header: () => (
          <span className="text-center block">
            {t("inventory-col-before") || "Before"}
          </span>
        ),
        cell: ({ row }) => (
          <div className="text-center text-xs font-mono text-muted-foreground">
            {numberFormatter.format(row.original.previousStock)}
          </div>
        ),
      },
      {
        id: "newStock",
        header: () => (
          <span className="text-center block">
            {t("inventory-col-after") || "After"}
          </span>
        ),
        cell: ({ row }) => (
          <div className="text-center text-xs font-mono font-semibold text-foreground">
            {numberFormatter.format(row.original.newStock)}
          </div>
        ),
      },
      {
        id: "reason",
        header: () => (
          <span className="text-start">
            {t("inventory-col-reason") || "Reason / Audit Note"}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5 max-w-xs">
              <span className="text-xs text-foreground line-clamp-2">
                {item.reason || "—"}
              </span>
              {item.referenceOrder && (
                <Link
                  href={`/admin/orders/${item.referenceOrder._id}`}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ShoppingBag className="size-3" />
                  <span>{item.referenceOrder.orderNumber}</span>
                </Link>
              )}
            </div>
          );
        },
      },
      {
        id: "performedBy",
        header: () => (
          <span className="text-start">
            {t("inventory-col-performed-by") || "Performed By"}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.performedBy) {
            return (
              <span className="text-xs text-muted-foreground italic">
                {t("inventory-system-automated") || "System Automated"}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <User className="size-3.5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">
                  {item.performedBy.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.performedBy.role}
                </span>
              </div>
            </div>
          );
        },
      },
    ];
  }, [t, locale, numberFormatter]);

  // TanStack Table Instance
  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  // Functions
  function handleResetFilters() {
    setType("ALL");
    setSkuInput("");
    setDebouncedSku("");
    setSortBy("createdAt:desc");
    setPage(1);
  }

  function handleTypeChange(val: string) {
    setType(val);
    setPage(1);
  }

  function handleSortByChange(val: string) {
    setSortBy(val);
    setPage(1);
  }

  return (
    <Card className="border border-border/70 shadow-xs">
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="size-4.5 text-blue-500" />
                <span>
                  {t("inventory-movements-title") || "Stock Movement Audit Trail"}
                </span>
              </CardTitle>
              {meta.total > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {meta.total}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {t("inventory-movements-desc") ||
                "Complete history of automated order reservations, sales, returns, and manual adjustments."}
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>{t("inventory-btn-refresh") || "Refresh"}</span>
          </Button>
        </div>

        {/* Filters */}
        <InventoryMovementsFilters
          type={type}
          onTypeChange={handleTypeChange}
          sku={skuInput}
          onSkuChange={setSkuInput}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          onReset={handleResetFilters}
        />
      </CardHeader>

      <CardContent>
        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <History className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
              {t("inventory-movements-empty-title") ||
                "No stock movements found"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("inventory-movements-empty-desc") ||
                "No movement records match the current filter criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-muted/40">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs font-medium">
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
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-xs py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  {t("inventory-pagination-showing", {
                    start: numberFormatter.format(startRecord),
                    end: numberFormatter.format(endRecord),
                    total: numberFormatter.format(meta.total),
                  }) ||
                    `Showing ${startRecord} to ${endRecord} of ${meta.total} records`}
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
                    {numberFormatter.format(page)} /{" "}
                    {numberFormatter.format(meta.totalPages)}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
