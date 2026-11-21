"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit2,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  FilterX,
  X,
  Loader2,
  ArrowUpDown,
  ShoppingBag,
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { Card, CardContent } from "@/shared/components/ui/card";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  formatCustomerDate,
  formatCustomerCurrency,
} from "../utils/customer.util";
import type {
  Customer,
  CustomerFilters,
  PaginationMeta,
} from "../types/customer.types";
import type { SafeUser } from "@/lib/auth/types";

interface CustomersTableProps {
  customers: Customer[];
  pagination?: PaginationMeta;
  filters: CustomerFilters;
  onFilterChange: (filters: CustomerFilters) => void;
  currentUser: SafeUser | null;
  locale: string;
  isFetching?: boolean;
  onEdit: (customer: Customer, tab?: "profile" | "tags" | "notes") => void;
}

export function CustomersTable({
  customers,
  pagination,
  filters,
  onFilterChange,
  currentUser,
  locale,
  isFetching,
  onEdit,
}: CustomersTableProps) {
  // Translation
  const t = useTranslations();

  // State
  const [searchInput, setSearchInput] = React.useState(filters.search ?? "");

  // Ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const filtersRef = React.useRef(filters);
  const lastCommittedSearchRef = React.useRef(filters.search ?? "");

  // Variables
  const canEdit = can(
    currentUser?.role,
    PERMISSIONS.CUSTOMERS_UPDATE,
    currentUser?.permissions
  );

  const currentPage = pagination?.page ?? filters.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? customers.length;
  const limit = pagination?.limit ?? filters.limit ?? 20;

  // Functions
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      lastCommittedSearchRef.current = value;
      onFilterChange({
        ...filtersRef.current,
        search: value.trim() ? value.trim() : undefined,
        page: 1,
      });
    }, 400);
  }

  function handleClearSearch() {
    setSearchInput("");
    lastCommittedSearchRef.current = "";
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onFilterChange({
      ...filters,
      search: undefined,
      page: 1,
    });
  }

  function handleResetFilters() {
    setSearchInput("");
    lastCommittedSearchRef.current = "";
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onFilterChange({
      page: 1,
      limit: filters.limit ?? 20,
      search: undefined,
      sortBy: "createdAt:desc",
    });
  }

  // Effects
  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  React.useEffect(() => {
    const currentPropSearch = filters.search ?? "";
    if (currentPropSearch !== lastCommittedSearchRef.current) {
      lastCommittedSearchRef.current = currentPropSearch;
      setSearchInput(currentPropSearch);
    }
  }, [filters.search]);

  return (
    <Card className="border border-border/60 overflow-hidden bg-card/60">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-border/60">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={
              t("customers-search-placeholder") ||
              "Search by customer name, phone, or email…"
            }
            className="ps-9 pe-9 h-9 text-xs bg-background/50"
          />
          {isFetching && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isFetching && searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sort and Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By */}
          <Select
            value={filters.sortBy || "createdAt:desc"}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                sortBy: val,
                page: 1,
              })
            }
          >
            <SelectTrigger className="h-9 text-xs min-w-[170px]">
              <ArrowUpDown className="me-1.5 size-3 text-muted-foreground" />
              <SelectValue
                placeholder={t("customers-sort-label") || "Sort by"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">
                {t("customers-sort-newest") || "Newest Registered"}
              </SelectItem>
              <SelectItem value="createdAt:asc">
                {t("customers-sort-oldest") || "Oldest Registered"}
              </SelectItem>
              <SelectItem value="totalSpent:desc">
                {t("customers-sort-highest-spend") || "Highest Spend"}
              </SelectItem>
              <SelectItem value="totalOrders:desc">
                {t("customers-sort-most-orders") || "Most Orders"}
              </SelectItem>
              <SelectItem value="fullName:asc">
                {t("customers-sort-name-asc") || "Name (A → Z)"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Button */}
          {filters.search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground gap-1"
            >
              <FilterX className="size-3.5" />
              <span>{t("customers-filter-reset") || "Reset"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <CardContent className="p-0">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted/60 p-4 mb-3">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              {t("customers-empty-title") || "No customers found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {filters.search
                ? t("customers-empty-search-desc") ||
                  "No customer profiles matched your search query."
                : t("customers-empty-desc") ||
                  "No customers have registered yet."}
            </p>
            {filters.search && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-4 text-xs"
              >
                {t("customers-filter-clear") || "Clear search"}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[26%]">
                    {t("customers-col-customer") || "Customer"}
                  </TableHead>
                  <TableHead className="w-[16%]">
                    {t("customers-col-phone") || "Phone"}
                  </TableHead>
                  <TableHead className="w-[16%] hidden sm:table-cell">
                    {t("customers-col-tags") || "Tags"}
                  </TableHead>
                  <TableHead className="w-[10%] text-center">
                    {t("customers-col-orders") || "Orders"}
                  </TableHead>
                  <TableHead className="w-[12%]">
                    {t("customers-col-spent") || "Total Spent"}
                  </TableHead>
                  <TableHead className="w-[12%] hidden lg:table-cell">
                    {t("customers-col-registered") || "Registered"}
                  </TableHead>
                  <TableHead className="w-[8%] text-right rtl:text-left">
                    {t("customers-col-actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((cust) => {
                  return (
                    <TableRow key={cust._id} className="transition-colors">
                      {/* Identity: Avatar + Name + Email */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-semibold text-primary text-sm uppercase">
                            {cust.fullName?.charAt(0) || "C"}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/customers/${cust._id}`}
                              className="font-medium text-foreground hover:underline truncate block max-w-[180px] sm:max-w-[240px]"
                            >
                              {cust.fullName}
                            </Link>
                            <span className="text-xs text-muted-foreground truncate block max-w-[180px] sm:max-w-[240px]">
                              {cust.email || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <span dir="ltr" className="font-mono text-xs text-foreground block">
                          {cust.phone}
                        </span>
                        {cust.secondaryPhone && (
                          <span dir="ltr" className="font-mono text-[11px] text-muted-foreground block">
                            {cust.secondaryPhone}
                          </span>
                        )}
                      </TableCell>

                      {/* Tags */}
                      <TableCell className="hidden sm:table-cell">
                        {cust.tags && cust.tags.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {cust.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[11px] font-normal px-2 py-0.5"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {cust.tags.length > 2 && (
                              <span className="text-[11px] text-muted-foreground">
                                +{cust.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Orders */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted/60 text-foreground">
                          <ShoppingBag className="size-3 text-muted-foreground" />
                          {cust.totalOrders ?? 0}
                        </span>
                      </TableCell>

                      {/* Total Spent */}
                      <TableCell>
                        <span className="font-medium text-xs text-foreground">
                          {formatCustomerCurrency(cust.totalSpent, locale)}
                        </span>
                      </TableCell>

                      {/* Registered Date */}
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatCustomerDate(cust.createdAt, locale)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right rtl:text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 text-xs"
                          >
                            <DropdownMenuLabel className="text-xs font-semibold">
                              {t("customers-action-manage") || "Customer Actions"}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/customers/${cust._id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="size-3.5" />
                                <span>
                                  {t("customers-action-view") || "View Profile"}
                                </span>
                              </Link>
                            </DropdownMenuItem>

                            {canEdit && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => onEdit(cust, "profile")}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="size-3.5" />
                                  <span>
                                    {t("customers-action-edit-profile") ||
                                      "Edit Details"}
                                  </span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => onEdit(cust, "tags")}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Tag className="size-3.5" />
                                  <span>
                                    {t("customers-action-manage-tags") ||
                                      "Manage Tags"}
                                  </span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => onEdit(cust, "notes")}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="size-3.5" />
                                  <span>
                                    {t("customers-action-edit-notes") ||
                                      "Internal Notes"}
                                  </span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {customers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {t("customers-pagination-showing") || "Showing"}{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * limit + 1}
                </span>{" "}
                –{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * limit, total)}
                </span>{" "}
                {t("customers-pagination-of") || "of"}{" "}
                <span className="font-medium text-foreground">{total}</span>{" "}
                {t("customers-pagination-total") || "customers"}
              </span>

              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline">
                  {t("customers-pagination-per-page") || "Per page:"}
                </span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) =>
                    onFilterChange({
                      ...filters,
                      limit: Number(val),
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prev / Next Page Buttons */}
            <div className="flex items-center gap-2">
              <span className="me-2">
                {t("customers-pagination-page") || "Page"}{" "}
                <span className="font-medium text-foreground">
                  {currentPage}
                </span>{" "}
                / {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage <= 1 || isFetching}
                onClick={() =>
                  onFilterChange({ ...filters, page: currentPage - 1 })
                }
                className="size-8"
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages || isFetching}
                onClick={() =>
                  onFilterChange({ ...filters, page: currentPage + 1 })
                }
                className="size-8"
              >
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
