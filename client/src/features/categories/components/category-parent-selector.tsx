"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import type { CategoryItem } from "../types/category.types";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getDescendantCategoryIds,
} from "../utils/category.util";

interface CategoryParentSelectorProps {
  categories: CategoryItem[];
  currentCategoryId?: string;
  value?: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}

export function CategoryParentSelector({
  categories,
  currentCategoryId,
  value,
  onChange,
  disabled = false,
}: CategoryParentSelectorProps) {
  const t = useTranslations();

  // 1. Calculate descendants of current category to block cycles
  const descendantIds = React.useMemo(() => {
    if (!currentCategoryId) return new Set<string>();
    return getDescendantCategoryIds(categories, currentCategoryId);
  }, [categories, currentCategoryId]);

  // 2. Build hierarchical list for indented visual representation
  const flattenedTree = React.useMemo(() => {
    const tree = buildCategoryTree(categories);
    return flattenCategoryTree(tree);
  }, [categories]);

  const selectValue = value ? String(value) : "none";

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="category-parent" className="text-sm font-medium">
          {t("category-form-parent-label")}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("category-form-parent-desc")}
        </p>
      </div>

      <Select
        value={selectValue}
        onValueChange={(val) => {
          if (val === "none") {
            onChange(null);
          } else {
            onChange(val);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="category-parent" className="w-full">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder={t("category-form-parent-none")} />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {/* Root option */}
          <SelectItem value="none" className="font-medium">
            {t("category-form-parent-none")}
          </SelectItem>

          {/* Hierarchically ordered category list */}
          {flattenedTree.map(({ node, depth }) => {
            const isSelf = currentCategoryId ? node._id === currentCategoryId : false;
            const isDescendant = currentCategoryId
              ? descendantIds.has(node._id)
              : false;
            const isDisabled = isSelf || isDescendant;

            // Generate indentation indicator: "— " repeated according to depth
            const indentPrefix = depth > 0 ? `${"— ".repeat(depth)}` : "";

            let disabledReason = "";
            if (isSelf) {
              disabledReason = ` (${t("category-form-parent-self-error")})`;
            } else if (isDescendant) {
              disabledReason = ` (${t("category-form-parent-descendant-error")})`;
            }

            return (
              <SelectItem
                key={node._id}
                value={node._id}
                disabled={isDisabled}
                className="text-xs"
              >
                <span className="font-mono text-muted-foreground text-[11px] me-1">
                  {indentPrefix}
                </span>
                <span className={depth === 0 ? "font-semibold" : "font-normal"}>
                  {node.name}
                </span>
                {disabledReason && (
                  <span className="text-[10px] text-muted-foreground italic ms-1">
                    {disabledReason}
                  </span>
                )}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
