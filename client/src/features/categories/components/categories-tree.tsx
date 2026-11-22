"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FolderTree, ChevronsUpDown, FolderPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CategoryTreeItem } from "./category-tree-item";
import type { CategoryTreeNode, CategoryItem } from "../types/category.types";

interface CategoriesTreeProps {
  tree: CategoryTreeNode[];
  allCategories: CategoryItem[];
  onDeleteRequest: (category: CategoryItem) => void;
  canWrite: boolean;
  isAr: boolean;
}

export function CategoriesTree({
  tree,
  allCategories,
  onDeleteRequest,
  canWrite,
  isAr,
}: CategoriesTreeProps) {
  const t = useTranslations();

  // Collect all category IDs with children for initial expansion
  const initialExpanded = React.useMemo(() => {
    const ids = new Set<string>();
    function collect(nodes: CategoryTreeNode[]) {
      for (const node of nodes) {
        if (node.children.length > 0) {
          ids.add(node._id);
          collect(node.children);
        }
      }
    }
    collect(tree);
    return ids;
  }, [tree]);

  const [expandedSet, setExpandedSet] = React.useState<Set<string>>(initialExpanded);

  // Sync if tree completely changes
  React.useEffect(() => {
    setExpandedSet(initialExpanded);
  }, [initialExpanded]);

  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = React.useCallback(() => {
    const ids = new Set<string>();
    function collect(nodes: CategoryTreeNode[]) {
      for (const node of nodes) {
        ids.add(node._id);
        if (node.children.length > 0) {
          collect(node.children);
        }
      }
    }
    collect(tree);
    setExpandedSet(ids);
  }, [tree]);

  const handleCollapseAll = React.useCallback(() => {
    setExpandedSet(new Set());
  }, []);

  if (tree.length === 0) {
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

  return (
    <div className="space-y-4">
      {/* Tree Controls Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FolderTree className="size-3.5 text-primary" />
          <span>{t("category-tree-root-count", { count: tree.length })}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronsUpDown className="size-3 me-1" />
            {t("category-tree-expand-all")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
          >
            {t("category-tree-collapse-all")}
          </Button>
        </div>
      </div>

      {/* Tree Nodes List */}
      <div className="space-y-3">
        {tree.map((rootNode) => (
          <CategoryTreeItem
            key={rootNode._id}
            node={rootNode}
            allCategories={allCategories}
            expandedSet={expandedSet}
            onToggleExpand={handleToggleExpand}
            onDeleteRequest={onDeleteRequest}
            canWrite={canWrite}
            isAr={isAr}
          />
        ))}
      </div>
    </div>
  );
}
