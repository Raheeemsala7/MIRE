"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  ImageIcon,
  FolderTree,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { CategoryStatusBadge } from "./category-status-badge";
import type { CategoryItem } from "../types/category.types";
import { getParentCategoryName, countDirectSubcategories } from "../utils/category.util";

interface CreateColumnsOptions {
  allCategories: CategoryItem[];
  onDeleteRequest: (category: CategoryItem) => void;
  canWrite: boolean;
  t: ReturnType<typeof useTranslations>;
}

export function createCategoryColumns({
  allCategories,
  onDeleteRequest,
  canWrite,
  t,
}: CreateColumnsOptions): ColumnDef<CategoryItem>[] {
  return [
    {
      id: "image",
      header: "",
      cell: ({ row }) => {
        const cat = row.original;
        const imgUrl = cat.image?.url;
        return (
          <div className="size-9 shrink-0 rounded-lg overflow-hidden border border-border/80 bg-muted/30 flex items-center justify-center">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt={cat.name}
                width={36}
                height={36}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground/40" />
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 50,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ms-3 h-8 text-xs font-semibold"
        >
          {t("category-table-col-name")}
          <ArrowUpDown className="ms-1.5 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <span>{cat.name}</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground" dir="ltr">
              /{cat.slug}
            </div>
          </div>
        );
      },
    },
    {
      id: "parentCategory",
      header: t("category-table-col-parent"),
      cell: ({ row }) => {
        const cat = row.original;
        const parentName = getParentCategoryName(cat, allCategories);
        if (parentName) {
          return (
            <Badge variant="outline" className="font-medium text-xs border-primary/20 bg-primary/5 text-primary">
              <FolderTree className="size-3 me-1 shrink-0" />
              {parentName}
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="font-medium text-[11px] text-muted-foreground bg-muted/60">
            {t("category-tree-root-badge")}
          </Badge>
        );
      },
    },
    {
      id: "subcategories",
      header: t("category-table-col-subs"),
      cell: ({ row }) => {
        const cat = row.original;
        const count = countDirectSubcategories(cat._id, allCategories);
        return (
          <span className="font-mono text-xs font-medium text-foreground">
            {count}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: t("category-table-col-status"),
      cell: ({ row }) => {
        return <CategoryStatusBadge isActive={row.original.isActive} />;
      },
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ms-3 h-8 text-xs font-semibold"
        >
          {t("category-table-col-order")}
          <ArrowUpDown className="ms-1.5 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.sortOrder ?? 0}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("category-table-col-actions"),
      cell: ({ row }) => {
        const cat = row.original;
        if (!canWrite) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-8 rounded-lg hover:bg-muted"
                aria-label="Category actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">
                {t("category-table-col-actions")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Add Subcategory */}
              <DropdownMenuItem asChild className="text-xs gap-2">
                <Link href={`/admin/categories/new?parent=${cat._id}`}>
                  <Plus className="size-3.5" />
                  <span>{t("categories-btn-add-sub")}</span>
                </Link>
              </DropdownMenuItem>

              {/* Edit */}
              <DropdownMenuItem asChild className="text-xs gap-2">
                <Link href={`/admin/categories/${cat._id}/edit`}>
                  <Pencil className="size-3.5" />
                  <span>{t("category-form-edit-title")}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                onClick={() => onDeleteRequest(cat)}
                className="text-xs gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                <span>{t("category-delete-title")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      size: 60,
    },
  ];
}
