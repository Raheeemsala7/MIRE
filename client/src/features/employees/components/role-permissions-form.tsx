"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  X,
  ShieldCheck,
  CheckCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  BACKEND_PERMISSIONS_CATALOG,
  BACKEND_DEFAULT_ROLE_PERMISSIONS,
  type SupportedEmployeeRole,
  type BackendPermissionDefinition,
} from "@/config/rbac.config";
import type { SafeUser } from "@/lib/auth/types";

interface RolePermissionsFormProps {
  selectedRole?: SupportedEmployeeRole;
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  currentUser?: SafeUser | null;
}

export function RolePermissionsForm({
  selectedRole,
  selectedPermissions,
  onChange,
  disabled = false,
  currentUser,
}: RolePermissionsFormProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState("");

  const isSuperAdmin = currentUser ? currentUser.role === "SUPER_ADMIN" : true;
  const allowedPermissions = React.useMemo(() => {
    if (isSuperAdmin) return null;
    return new Set(currentUser?.permissions ?? []);
  }, [isSuperAdmin, currentUser?.permissions]);

  // Group permissions by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, BackendPermissionDefinition[]>();
    for (const item of BACKEND_PERMISSIONS_CATALOG) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, []);

  const isSuperAdminPreset = selectedPermissions.includes("*");

  // Filter categories and permissions by search query
  const filteredGrouped = React.useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase().trim();

    return grouped
      .map(([category, items]) => {
        const categoryTitle = (t(`employees-perm-cat-${category}`) || category).toLowerCase();
        const matchesCategory = categoryTitle.includes(q);

        const matchingItems = items.filter((item) => {
          if (matchesCategory) return true;
          const label = (t(item.labelKey) || "").toLowerCase();
          const id = item.id.toLowerCase();
          return label.includes(q) || id.includes(q);
        });

        return [category, matchingItems] as [string, BackendPermissionDefinition[]];
      })
      .filter(([, items]) => items.length > 0);
  }, [grouped, searchQuery, t]);

  function handleToggle(permId: string) {
    if (disabled) return;
    if (!isSuperAdmin && !allowedPermissions?.has(permId)) return;

    if (isSuperAdminPreset) {
      // Unpack from wildcard if modified
      const allPerms = BACKEND_PERMISSIONS_CATALOG.map((p) => p.id);
      onChange(allPerms.filter((id) => id !== permId));
      return;
    }

    if (selectedPermissions.includes(permId)) {
      onChange(selectedPermissions.filter((id) => id !== permId));
    } else {
      onChange([...selectedPermissions, permId]);
    }
  }

  function handleToggleCategory(categoryItems: BackendPermissionDefinition[]) {
    if (disabled) return;

    const assignableIds = categoryItems
      .filter((item) => isSuperAdmin || (allowedPermissions?.has(item.id) ?? false))
      .map((item) => item.id);

    if (assignableIds.length === 0) return;

    const allChecked = assignableIds.every((id) =>
      isSuperAdminPreset || selectedPermissions.includes(id)
    );

    if (isSuperAdminPreset) {
      const allPerms = BACKEND_PERMISSIONS_CATALOG.map((p) => p.id);
      if (allChecked) {
        onChange(allPerms.filter((id) => !assignableIds.includes(id)));
      } else {
        onChange(allPerms);
      }
      return;
    }

    if (allChecked) {
      // Uncheck all in category
      onChange(selectedPermissions.filter((id) => !assignableIds.includes(id)));
    } else {
      // Check all in category
      const merged = new Set([...selectedPermissions, ...assignableIds]);
      onChange(Array.from(merged));
    }
  }

  function handleApplyRoleDefaults() {
    if (disabled || !selectedRole) return;
    const defaults = BACKEND_DEFAULT_ROLE_PERMISSIONS[selectedRole] || [];
    const filteredDefaults = isSuperAdmin
      ? defaults
      : defaults.filter((p) => allowedPermissions?.has(p));
    onChange([...filteredDefaults]);
  }

  function handleSelectAll() {
    if (disabled) return;
    if (isSuperAdmin) {
      onChange(BACKEND_PERMISSIONS_CATALOG.map((p) => p.id));
    } else {
      onChange(
        BACKEND_PERMISSIONS_CATALOG
          .map((p) => p.id)
          .filter((id) => allowedPermissions?.has(id))
      );
    }
  }

  function handleClearAll() {
    if (disabled) return;
    onChange([]);
  }

  const effectiveCount = isSuperAdminPreset
    ? BACKEND_PERMISSIONS_CATALOG.length
    : selectedPermissions.length;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 border-b border-border/60 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-foreground">
                  {t("employees-permissions-heading") || "Granular System Permissions"}
                </h4>
                <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                  {effectiveCount} / {BACKEND_PERMISSIONS_CATALOG.length}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("employees-permissions-subheading") ||
                  "Customize backend access flags for this account."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedRole && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyRoleDefaults}
                disabled={disabled}
                className="text-xs h-7 px-2.5 gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                <span>{t("employees-perm-preset-default") || "Default for Role"}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={disabled}
              className="text-xs h-7 px-2.5 gap-1 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3" />
              <span>{t("employees-perm-select-all") || "Select All"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              {t("employees-perm-clear") || "Clear"}
            </Button>
          </div>
        </div>

        {/* Quick Search within Permissions */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground rtl:left-auto rtl:right-2.5 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              t("employees-perm-search-ph") ||
              "Search permissions or categories…"
            }
            className="h-8 text-xs pl-8 pr-7 rtl:pl-7 rtl:pr-8 bg-background/80"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Wildcard Alert */}
      {isSuperAdminPreset && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 shrink-0" />
            <span>
              {t("employees-perm-superadmin-wildcard") ||
                "This account currently holds full Super Admin wildcard permissions (*)."}
            </span>
          </div>
          <Badge variant="default" className="text-[10px]">ALL ACCESS</Badge>
        </div>
      )}

      {/* Categories Grid — with hidden scrollbar and smooth scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-0.5">
        {filteredGrouped.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            {t("employees-perm-empty") || "No matching permissions found."}
          </div>
        ) : (
          filteredGrouped.map(([category, items]) => {
            const categoryTitle =
              t(`employees-perm-cat-${category}`) || category.toUpperCase();

            const assignableItems = items.filter(
              (item) => isSuperAdmin || (allowedPermissions?.has(item.id) ?? false)
            );

            const categoryCheckedCount = items.filter((item) =>
              isSuperAdminPreset || selectedPermissions.includes(item.id)
            ).length;

            const isFullyChecked =
              assignableItems.length > 0 &&
              assignableItems.every((item) =>
                isSuperAdminPreset || selectedPermissions.includes(item.id)
              );

            return (
              <div
                key={category}
                className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-2 transition-colors hover:border-border"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between gap-1 border-b border-border/40 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      {categoryTitle}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({categoryCheckedCount}/{items.length})
                    </span>
                  </div>

                  {assignableItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(items)}
                      disabled={disabled}
                      className="text-[11px] text-primary hover:underline cursor-pointer select-none font-medium"
                    >
                      {isFullyChecked
                        ? t("employees-perm-clear") || "Clear"
                        : t("employees-perm-select-all") || "All"}
                    </button>
                  )}
                </div>

                {/* Permission checkboxes */}
                <div className="space-y-1.5 pt-0.5">
                  {items.map((perm) => {
                    const isChecked =
                      isSuperAdminPreset || selectedPermissions.includes(perm.id);
                    const isAllowed =
                      isSuperAdmin || (allowedPermissions?.has(perm.id) ?? false);
                    const isItemDisabled = disabled || !isAllowed;
                    const permLabel = t(perm.labelKey) || perm.id;

                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2 text-xs select-none rounded-md px-2 py-1.5 transition-colors ${
                          isItemDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : isChecked
                            ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                            : "hover:bg-accent/50 cursor-pointer"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(perm.id)}
                          disabled={isItemDisabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground block text-[12px] leading-tight">
                            {permLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80 font-mono block mt-0.5">
                            {perm.id}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
