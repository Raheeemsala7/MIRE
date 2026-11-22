"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ChevronRight,
  ChevronDown,
  FolderTree,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { CategoryStatusBadge } from "./category-status-badge";
import type { CategoryTreeNode, CategoryItem } from "../types/category.types";

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  allCategories: CategoryItem[];
  expandedSet: Set<string>;
  onToggleExpand: (id: string) => void;
  onDeleteRequest: (category: CategoryItem) => void;
  canWrite: boolean;
  isAr: boolean;
}

export const CategoryTreeItem = React.memo(function CategoryTreeItem({
  node,
  allCategories,
  expandedSet,
  onToggleExpand,
  onDeleteRequest,
  canWrite,
  isAr,
}: CategoryTreeItemProps) {
  const t = useTranslations();
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedSet.has(node._id);

  const ChevronIcon = isExpanded
    ? ChevronDown
    : isAr
    ? ChevronRight // in RTL, closed arrow points left or right, but ChevronRight is styled with dir
    : ChevronRight;

  return (
    <div className="group/tree-item relative select-none">
      {/* Node Row */}
      <div
        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
          isExpanded
            ? "border-primary/30 bg-primary/5 shadow-2xs"
            : "border-border/60 bg-card hover:bg-muted/50 hover:border-border"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Expand/Collapse Button or leaf spacer */}
          {hasChildren ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onToggleExpand(node._id)}
              className="size-6 shrink-0 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-transform"
              aria-label={isExpanded ? "Collapse branch" : "Expand branch"}
            >
              <ChevronIcon
                className={`size-4 transition-transform duration-200 ${
                  isExpanded ? "" : isAr ? "rotate-180" : ""
                }`}
              />
            </Button>
          ) : (
            <div className="size-6 shrink-0 flex items-center justify-center">
              <span className="size-1.5 rounded-full bg-border" />
            </div>
          )}

          {/* Folder Icon */}
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              hasChildren
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="size-4" />
              ) : (
                <Folder className="size-4" />
              )
            ) : (
              <FolderTree className="size-3.5" />
            )}
          </div>

          {/* Image Thumbnail (if available) */}
          {node.image?.url ? (
            <div className="relative size-7 shrink-0 rounded-md overflow-hidden border border-border/80 bg-muted/30">
              <Image
                src={node.image.url}
                alt={node.name}
                fill
                sizes="28px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="size-7 shrink-0 rounded-md border border-border/40 bg-muted/20 flex items-center justify-center text-muted-foreground/40">
              <ImageIcon className="size-3.5" />
            </div>
          )}

          {/* Category Info */}
          <div className="min-w-0 flex-1 truncate">
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-semibold text-foreground truncate">
                {node.name}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground shrink-0 hidden sm:inline" dir="ltr">
                /{node.slug}
              </span>
            </div>
            {node.description && (
              <p className="text-[11px] text-muted-foreground truncate max-w-md">
                {node.description}
              </p>
            )}
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Subcategories count badge */}
          {hasChildren && (
            <Badge
              variant="secondary"
              className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-foreground/80 hidden sm:inline-flex"
            >
              {t("category-subcategories-count", { count: node.children.length })}
            </Badge>
          )}

          {/* Status Badge */}
          <CategoryStatusBadge isActive={node.isActive} />

          {/* Action buttons */}
          {canWrite && (
            <div className="flex items-center gap-1 opacity-80 group-hover/tree-item:opacity-100 transition-opacity">
              {/* Add subcategory button */}
              <Button
                asChild
                variant="ghost"
                size="icon-xs"
                className="size-7 rounded-md hover:bg-primary/10 hover:text-primary"
                title={t("categories-btn-add-sub")}
              >
                <Link href={`/admin/categories/new?parent=${node._id}`}>
                  <Plus className="size-3.5" />
                </Link>
              </Button>

              {/* Edit button */}
              <Button
                asChild
                variant="ghost"
                size="icon-xs"
                className="size-7 rounded-md hover:bg-primary/10 hover:text-primary"
                title={t("category-form-edit-title")}
              >
                <Link href={`/admin/categories/${node._id}/edit`}>
                  <Pencil className="size-3.5" />
                </Link>
              </Button>

              {/* Delete button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onDeleteRequest(node)}
                className="size-7 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                title={t("category-delete-title")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Children Branches (Indented) */}
      {hasChildren && isExpanded && (
        <div className="relative mt-2 ms-4 ps-4 sm:ms-6 sm:ps-6 border-s-2 border-primary/20 space-y-2">
          {node.children.map((childNode) => (
            <CategoryTreeItem
              key={childNode._id}
              node={childNode}
              allCategories={allCategories}
              expandedSet={expandedSet}
              onToggleExpand={onToggleExpand}
              onDeleteRequest={onDeleteRequest}
              canWrite={canWrite}
              isAr={isAr}
            />
          ))}
        </div>
      )}
    </div>
  );
});
