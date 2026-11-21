"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Power,
  Package,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import type {
  Bundle,
  BundleFilters,
  BundleStatus,
  BundleType,
  BundlesPaginationMeta,
} from "../types/bundle.types";
import {
  getBundleStatus,
  getBundleStatusBadgeConfig,
  getBundleTypeLabelKey,
  formatBundleCurrency,
  formatBundleDate,
} from "../utils/bundle.util";
import type { SafeUser } from "@/lib/auth/types";

interface BundlesTableProps {
  bundles: Bundle[];
  pagination?: BundlesPaginationMeta;
  filters: BundleFilters;
  onFilterChange: (filters: Partial<BundleFilters>) => void;
  currentUser: SafeUser | null;
  locale: string;
  isFetching: boolean;
  onDelete: (bundle: Bundle) => void;
  onToggleStatus: (bundle: Bundle, nextActive: boolean) => void;
}

export function BundlesTable({
  bundles,
  pagination,
  filters,
  onFilterChange,
  currentUser,
  locale,
  isFetching,
  onDelete,
  onToggleStatus,
}: BundlesTableProps) {
  const t = useTranslations();
  const [searchInput, setSearchInput] = React.useState(filters.search || "");

  // Debounce search filter input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        onFilterChange({ search: searchInput.trim() || undefined, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  const canEdit = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_UPDATE,
    currentUser?.permissions
  );

  const canDelete = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_DELETE,
    currentUser?.permissions
  );

  const canCreate = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_CREATE,
    currentUser?.permissions
  );

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.type ||
      (filters.status && filters.status !== "ALL") ||
      filters.sortBy
  );

  function resetFilters() {
    setSearchInput("");
    onFilterChange({
      search: undefined,
      type: undefined,
      status: undefined,
      sortBy: undefined,
      page: 1,
    });
  }

  // Helper to format rule summary
  function renderRuleSummary(bundle: Bundle) {
    switch (bundle.type) {
      case "FIXED_PRICE":
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground">
              {formatBundleCurrency(bundle.bundlePrice, locale)}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {t("bundle-rule-for-qty") || "for"} {bundle.requiredQuantity}{" "}
              {t("bundle-rule-items") || "items"}
            </p>
          </div>
        );
      case "BUY_X_GET_Y":
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-primary">
              {t("bundle-rule-buy") || "Buy"} {bundle.requiredQuantity} + {t("bundle-rule-get") || "Get"}{" "}
              {bundle.freeQuantity} {t("bundle-rule-free") || "Free"}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {t("bundle-rule-bogo-lowest") || "Lowest priced free"}
            </p>
          </div>
        );
      case "PERCENTAGE":
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground">
              {bundle.discountPercentage}% {t("bundle-rule-off") || "OFF"}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {t("bundle-rule-min-qty") || "Min"}: {bundle.requiredQuantity}{" "}
              {t("bundle-rule-items") || "items"}
            </p>
          </div>
        );
      case "COLLECTION_PICK":
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground">
              {formatBundleCurrency(bundle.bundlePrice, locale)}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {t("bundle-rule-pick-any") || "Pick any"} {bundle.requiredQuantity}
            </p>
          </div>
        );
      default:
        return <span className="text-xs text-muted-foreground">-</span>;
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-border/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                t("bundle-search-placeholder") ||
                "Search bundles by title or description..."
              }
              className="ps-9 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <Select
            value={filters.type || "ALL"}
            onValueChange={(val) =>
              onFilterChange({
                type: val === "ALL" ? undefined : (val as BundleType),
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-44 text-xs">
              <SelectValue placeholder={t("bundle-filter-type") || "Offer Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("bundle-type-all") || "All Types"}
              </SelectItem>
              <SelectItem value="FIXED_PRICE" className="text-xs">
                {t("bundle-type-fixed-price") || "Fixed Price"}
              </SelectItem>
              <SelectItem value="BUY_X_GET_Y" className="text-xs">
                {t("bundle-type-buy-x-get-y") || "Buy X Get Y"}
              </SelectItem>
              <SelectItem value="PERCENTAGE" className="text-xs">
                {t("bundle-type-percentage") || "Percentage Discount"}
              </SelectItem>
              <SelectItem value="COLLECTION_PICK" className="text-xs">
                {t("bundle-type-collection-pick") || "Collection Pick"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) =>
              onFilterChange({
                status: val as BundleStatus,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-36 text-xs">
              <SelectValue placeholder={t("bundle-filter-status") || "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                {t("bundle-status-all") || "All Statuses"}
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">
                {t("bundle-status-active") || "Active"}
              </SelectItem>
              <SelectItem value="SCHEDULED" className="text-xs">
                {t("bundle-status-scheduled") || "Scheduled"}
              </SelectItem>
              <SelectItem value="EXPIRED" className="text-xs">
                {t("bundle-status-expired") || "Expired"}
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">
                {t("bundle-status-inactive") || "Inactive"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={filters.sortBy || "createdAt:desc"}
            onValueChange={(val) => onFilterChange({ sortBy: val, page: 1 })}
          >
            <SelectTrigger className="w-full sm:w-44 text-xs">
              <ArrowUpDown className="size-3.5 me-2 text-muted-foreground" />
              <SelectValue placeholder={t("bundle-sort-by") || "Sort by"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc" className="text-xs">
                {t("bundle-sort-newest") || "Newest First"}
              </SelectItem>
              <SelectItem value="createdAt:asc" className="text-xs">
                {t("bundle-sort-oldest") || "Oldest First"}
              </SelectItem>
              <SelectItem value="title:asc" className="text-xs">
                {t("bundle-sort-title") || "Title (A-Z)"}
              </SelectItem>
              <SelectItem value="startDate:desc" className="text-xs">
                {t("bundle-sort-start-date") || "Start Date"}
              </SelectItem>
              <SelectItem value="endDate:asc" className="text-xs">
                {t("bundle-sort-end-date") || "Expiring Soonest"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs h-9 text-muted-foreground hover:text-foreground self-start md:self-auto"
          >
            <X className="size-3.5 me-1.5" />
            <span>{t("bundle-filter-reset") || "Reset Filters"}</span>
          </Button>
        )}
      </div>

      {/* Main Table Content */}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[30%] text-xs font-semibold">
                {t("bundle-col-offer") || "Offer & Description"}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("bundle-col-type") || "Type"}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("bundle-col-scope") || "Eligible Scope"}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("bundle-col-rule") || "Pricing / Rule"}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("bundle-col-schedule") || "Schedule"}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("bundle-col-status") || "Status"}
              </TableHead>
              <TableHead className="w-[70px] text-end text-xs font-semibold">
                {t("bundle-col-actions") || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {t("bundle-empty-title") || "No promotional bundles found"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? t("bundle-empty-filter-desc") ||
                            "No offers match your current filter criteria. Try adjusting your search or filters."
                          : t("bundle-empty-desc") ||
                            "Create your first promotional bundle or special offer to boost sales and customer engagement."}
                      </p>
                    </div>
                    {canCreate && !hasActiveFilters && (
                      <Button asChild size="sm" className="text-xs gap-1.5 mt-2">
                        <Link href="/admin/bundles/new">
                          <Plus className="size-3.5" />
                          <span>{t("bundle-btn-add") || "Create Bundle"}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              bundles.map((bundle) => {
                const status = getBundleStatus(bundle);
                const badgeConfig = getBundleStatusBadgeConfig(status);
                const productCount = Array.isArray(bundle.eligibleProducts)
                  ? bundle.eligibleProducts.length
                  : 0;
                const categoryCount = Array.isArray(bundle.eligibleCategories)
                  ? bundle.eligibleCategories.length
                  : 0;

                return (
                  <TableRow
                    key={bundle._id}
                    className="border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {/* Offer Title & Slug */}
                    <TableCell className="align-top py-3">
                      <div className="space-y-1 min-w-0">
                        <Link
                          href={`/admin/bundles/${bundle._id}`}
                          className="font-medium text-xs text-foreground hover:underline line-clamp-1"
                        >
                          {bundle.title}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <span dir="ltr" className="text-[10px] text-muted-foreground font-mono">
                            /{bundle.slug}
                          </span>
                        </div>
                        {bundle.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {bundle.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell className="align-top py-3">
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {t(getBundleTypeLabelKey(bundle.type))}
                      </Badge>
                    </TableCell>

                    {/* Eligible Scope */}
                    <TableCell className="align-top py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <Package className="size-3.5 text-muted-foreground" />
                          <span>
                            {productCount > 0
                              ? `${productCount} ${t("bundle-scope-products") || "Products"}`
                              : t("bundle-scope-all-products") || "All Products"}
                          </span>
                        </div>
                        {categoryCount > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Layers className="size-3 text-muted-foreground" />
                            <span>
                              {categoryCount} {t("bundle-scope-categories") || "Categories"}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Pricing / Rule */}
                    <TableCell className="align-top py-3">
                      {renderRuleSummary(bundle)}
                    </TableCell>

                    {/* Schedule */}
                    <TableCell className="align-top py-3">
                      <div className="space-y-0.5 text-xs">
                        <div className="text-muted-foreground">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 me-1">
                            {t("bundle-schedule-from") || "From"}:
                          </span>
                          <span className="text-foreground">
                            {formatBundleDate(bundle.startDate, locale)}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 me-1">
                            {t("bundle-schedule-to") || "To"}:
                          </span>
                          <span className="text-foreground">
                            {formatBundleDate(bundle.endDate, locale)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="align-top py-3">
                      <Badge
                        variant={badgeConfig.variant}
                        className={`text-[10px] px-2 py-0.5 ${badgeConfig.className}`}
                      >
                        {t(badgeConfig.labelKey)}
                      </Badge>
                    </TableCell>

                    {/* Row Actions Dropdown */}
                    <TableCell className="align-top py-3 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 hover:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">
                              {t("bundle-actions-trigger") || "Actions"}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuLabel className="text-xs">
                            {t("bundle-actions-title") || "Actions"}
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/bundles/${bundle._id}`}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="size-3.5 text-muted-foreground" />
                              <span>{t("bundle-action-view") || "View Details"}</span>
                            </Link>
                          </DropdownMenuItem>

                          {canEdit && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/bundles/${bundle._id}/edit`}
                                className="gap-2 cursor-pointer"
                              >
                                <Edit className="size-3.5 text-muted-foreground" />
                                <span>{t("bundle-action-edit") || "Edit Offer"}</span>
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => onToggleStatus(bundle, !bundle.isActive)}
                              className="gap-2 cursor-pointer"
                            >
                              <Power
                                className={`size-3.5 ${
                                  bundle.isActive ? "text-amber-500" : "text-emerald-500"
                                }`}
                              />
                              <span>
                                {bundle.isActive
                                  ? t("bundle-action-deactivate") || "Deactivate"
                                  : t("bundle-action-activate") || "Activate"}
                              </span>
                            </DropdownMenuItem>
                          )}

                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(bundle)}
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                                <span>{t("bundle-action-delete") || "Delete Offer"}</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 gap-3 text-xs text-muted-foreground">
            <div>
              {t("bundle-pagination-summary") || "Showing"}{" "}
              <strong className="text-foreground">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              {t("bundle-pagination-to") || "to"}{" "}
              <strong className="text-foreground">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              {t("bundle-pagination-of") || "of"}{" "}
              <strong className="text-foreground">{pagination.total}</strong>{" "}
              {t("bundle-pagination-results") || "offers"}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage || isFetching}
                onClick={() => onFilterChange({ page: pagination.page - 1 })}
                className="text-xs h-8 px-2.5 gap-1"
              >
                <ChevronLeft className="size-3.5 rtl:rotate-180" />
                <span>{t("bundle-pagination-prev") || "Previous"}</span>
              </Button>
              <span className="px-2 text-xs font-mono font-medium text-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => onFilterChange({ page: pagination.page + 1 })}
                className="text-xs h-8 px-2.5 gap-1"
              >
                <span>{t("bundle-pagination-next") || "Next"}</span>
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
