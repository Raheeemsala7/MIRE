"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { FolderPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { createCategoryColumns } from "./category-columns";
import type { CategoryItem } from "../types/category.types";

interface CategoriesTableProps {
  categories: CategoryItem[];
  allCategories: CategoryItem[];
  onDeleteRequest: (category: CategoryItem) => void;
  canWrite: boolean;
  isAr?: boolean;
}

export function CategoriesTable({
  categories,
  allCategories,
  onDeleteRequest,
  canWrite,
  isAr = false,
}: CategoriesTableProps) {
  const t = useTranslations();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "sortOrder", desc: false },
  ]);

  const columns = React.useMemo(
    () =>
      createCategoryColumns({
        allCategories,
        onDeleteRequest,
        canWrite,
        t,
      }),
    [allCategories, onDeleteRequest, canWrite, t]
  );

  const table = useReactTable({
    data: categories,
    columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground mb-3">
          <FolderPlus className="size-6 opacity-60" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("category-empty-title")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {t("category-empty-desc")}
        </p>
      </div>
    );
  }

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalItems = categories.length;
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-xs font-semibold h-11">
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
              className="hover:bg-muted/40 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {t("category-table-pagination-showing", {
              start: startItem,
              end: endItem,
              total: totalItems,
            })}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 gap-1 text-xs"
            >
              {isAr ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronLeft className="size-3.5" />
              )}
              <span>{t("category-table-pagination-prev")}</span>
            </Button>

            <span className="text-xs text-muted-foreground px-2 font-mono">
              {pageIndex + 1} / {table.getPageCount()}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 gap-1 text-xs"
            >
              <span>{t("category-table-pagination-next")}</span>
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
