"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit2,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  FilterX,
  X,
  Loader2,
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
import {
  PERMISSIONS,
  SUPPORTED_EMPLOYEE_ROLES,
  type SupportedEmployeeRole,
} from "@/config/rbac.config";
import { getRoleBadgeVariant, formatEmployeeDate } from "../utils/employee.util";
import type { Employee, EmployeeFilters, PaginationMeta } from "../types/employee.types";
import type { SafeUser } from "@/lib/auth/types";

interface EmployeesTableProps {
  employees: Employee[];
  pagination?: PaginationMeta;
  filters: EmployeeFilters;
  onFilterChange: (filters: EmployeeFilters) => void;
  currentUser: SafeUser | null;
  locale: string;
  isFetching?: boolean;
  onEdit: (emp: Employee) => void;
  onManagePermissions: (emp: Employee) => void;
  onToggleStatus: (emp: Employee) => void;
}

export function EmployeesTable({
  employees,
  pagination,
  filters,
  onFilterChange,
  currentUser,
  locale,
  isFetching,
  onEdit,
  onManagePermissions,
  onToggleStatus,
}: EmployeesTableProps) {
  const t = useTranslations();
  const [searchInput, setSearchInput] = React.useState(filters.search ?? "");
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const filtersRef = React.useRef(filters);
  const lastCommittedSearchRef = React.useRef(filters.search ?? "");

  // Keep latest filters ref updated to prevent stale closures in debounce callbacks
  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Sync search input if filters.search changes externally (e.g. reset or query param sync)
  React.useEffect(() => {
    const currentPropSearch = filters.search ?? "";
    if (currentPropSearch !== lastCommittedSearchRef.current) {
      lastCommittedSearchRef.current = currentPropSearch;
      setSearchInput(currentPropSearch);
    }
  }, [filters.search]);

  // Clean up debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = val.trim();
      lastCommittedSearchRef.current = trimmed;
      onFilterChange({ ...filtersRef.current, search: trimmed, page: 1 });
    }, 600);
  };

  const handleSearchSubmit = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const trimmed = searchInput.trim();
    lastCommittedSearchRef.current = trimmed;
    onFilterChange({ ...filtersRef.current, search: trimmed, page: 1 });
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput("");
    lastCommittedSearchRef.current = "";
    onFilterChange({ ...filtersRef.current, search: "", page: 1 });
  };

  const canEdit = can(currentUser?.role, PERMISSIONS.EMPLOYEES_UPDATE, currentUser?.permissions);
  const canManageRoles = can(currentUser?.role, PERMISSIONS.EMPLOYEES_MANAGE_ROLES, currentUser?.permissions);
  const canToggle = can(currentUser?.role, PERMISSIONS.EMPLOYEES_TOGGLE_STATUS, currentUser?.permissions);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  function handleResetFilters() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput("");
    lastCommittedSearchRef.current = "";
    onFilterChange({
      page: 1,
      limit: filters.limit || 20,
      sort: "-createdAt",
      search: "",
      role: undefined,
      isActive: undefined,
    });
  }

  // Pagination calculations
  const currentPage = pagination?.page || filters.page || 1;
  const currentLimit = pagination?.limit || filters.limit || 20;
  const totalCount = pagination?.total ?? employees.length;
  const totalPages = pagination?.totalPages || Math.ceil(totalCount / currentLimit) || 1;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, totalCount);

  return (
    <Card className="border border-ds-border-subtle overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 border-b border-border/60 bg-card/40">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          {isFetching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin rtl:left-auto rtl:right-3 pointer-events-none" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none" />
          )}
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
            placeholder={t("employees-search-ph") || "Search by name or email…"}
            className="pl-9 pr-8 rtl:pl-8 rtl:pr-9 h-9 text-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <Select
            value={filters.role || "ALL"}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                role: val === "ALL" ? undefined : val,
                page: 1,
              })
            }
          >
            <SelectTrigger className="h-9 text-xs min-w-[130px]">
              <SelectValue placeholder={t("employees-filter-role") || "All Roles"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("employees-filter-all-roles") || "All Roles"}
              </SelectItem>
              {SUPPORTED_EMPLOYEE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {t(`employees-role-${role}`) || role.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.isActive ?? "ALL"}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                isActive: val === "ALL" ? undefined : val,
                page: 1,
              })
            }
          >
            <SelectTrigger className="h-9 text-xs min-w-[120px]">
              <SelectValue placeholder={t("employees-filter-status") || "All Statuses"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("employees-filter-all-statuses") || "All Statuses"}
              </SelectItem>
              <SelectItem value="true">
                {t("employees-status-active") || "Active"}
              </SelectItem>
              <SelectItem value="false">
                {t("employees-status-inactive") || "Inactive"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {(filters.search || filters.role || filters.isActive) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground gap-1"
            >
              <FilterX className="size-3.5" />
              <span>{t("employees-filter-reset") || "Reset"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <CardContent className="p-0">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted/60 p-4 mb-3">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              {t("employees-empty-title") || "No employees found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {t("employees-empty-desc") ||
                "No team members matched your current filter criteria."}
            </p>
            {(filters.search || filters.role || filters.isActive) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-4 text-xs"
              >
                {t("employees-filter-clear") || "Clear all filters"}
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%]">
                  {t("employees-col-staff") || "Staff Member"}
                </TableHead>
                <TableHead className="w-[20%]">
                  {t("employees-col-role") || "Assigned Role"}
                </TableHead>
                <TableHead className="w-[15%]">
                  {t("employees-col-status") || "Account Status"}
                </TableHead>
                <TableHead className="w-[20%] hidden md:table-cell">
                  {t("employees-col-created") || "Joined Date"}
                </TableHead>
                <TableHead className="w-[15%] text-right rtl:text-left">
                  {t("employees-col-actions") || "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const isTargetSuperAdmin = emp.role === "SUPER_ADMIN";
                const isSelf = currentUser ? currentUser.id === emp._id : false;
                const canModifyTarget = isSuperAdmin || !isTargetSuperAdmin;

                return (
                  <TableRow key={emp._id}>
                    {/* Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-semibold text-primary text-sm uppercase">
                          {emp.name.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/employees/${emp._id}`}
                            className="font-medium text-foreground hover:underline truncate block max-w-[200px] sm:max-w-[280px]"
                          >
                            {emp.name}
                          </Link>
                          <span className="text-xs text-muted-foreground truncate block max-w-[200px] sm:max-w-[280px]">
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(emp.role as SupportedEmployeeRole)}
                        className="text-[11px] font-normal"
                      >
                        {t(`employees-role-${emp.role}`) || emp.role.replace("_", " ")}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          emp.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            emp.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {emp.isActive
                          ? t("employees-status-active") || "Active"
                          : t("employees-status-inactive") || "Inactive"}
                      </span>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {formatEmployeeDate(emp.createdAt, locale)}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right rtl:text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="size-8 p-0">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs">
                            {t("employees-actions-label") || "Staff Actions"}
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/employees/${emp._id}`}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Eye className="size-3.5" />
                              <span>{t("employees-action-view") || "View Details"}</span>
                            </Link>
                          </DropdownMenuItem>

                          {canEdit && canModifyTarget && (
                            <DropdownMenuItem
                              onClick={() => onEdit(emp)}
                              className="flex items-center gap-2 text-xs cursor-pointer"
                            >
                              <Edit2 className="size-3.5" />
                              <span>{t("employees-action-edit") || "Edit Employee"}</span>
                            </DropdownMenuItem>
                          )}

                          {canManageRoles && canModifyTarget && (
                            <DropdownMenuItem
                              onClick={() => onManagePermissions(emp)}
                              className="flex items-center gap-2 text-xs cursor-pointer"
                            >
                              <ShieldCheck className="size-3.5" />
                              <span>{t("employees-action-perms") || "Permissions"}</span>
                            </DropdownMenuItem>
                          )}

                          {canToggle && !isSelf && canModifyTarget && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onToggleStatus(emp)}
                                className={`flex items-center gap-2 text-xs cursor-pointer ${
                                  emp.isActive
                                    ? "text-destructive focus:text-destructive"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {emp.isActive ? (
                                  <>
                                    <UserX className="size-3.5" />
                                    <span>{t("employees-action-deactivate") || "Deactivate"}</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="size-3.5" />
                                    <span>{t("employees-action-activate") || "Activate"}</span>
                                  </>
                                )}
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
        )}
      </CardContent>

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 text-xs text-muted-foreground bg-card/20">
          <div className="flex items-center gap-3">
            <span>
              {locale === "ar"
                ? `عرض ${startItem}-${endItem} من ${totalCount} موظف`
                : `Showing ${startItem}-${endItem} of ${totalCount} staff`}
            </span>

            {/* Rows per page selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {locale === "ar" ? "لكل صفحة:" : "Per page:"}
              </span>
              <Select
                value={String(currentLimit)}
                onValueChange={(val) =>
                  onFilterChange({ ...filtersRef.current, limit: Number(val), page: 1 })
                }
              >
                <SelectTrigger className="h-7 w-16 text-xs px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Page navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                onFilterChange({ ...filtersRef.current, page: currentPage - 1 })
              }
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="size-3.5 rtl:rotate-180" />
              <span className="hidden sm:inline">
                {locale === "ar" ? "السابق" : "Previous"}
              </span>
            </Button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 5) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - currentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span className="px-1 text-muted-foreground select-none">…</span>
                      )}
                      <Button
                        variant={p === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange({ ...filtersRef.current, page: p })}
                        className="size-8 p-0 text-xs font-mono"
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                onFilterChange({ ...filtersRef.current, page: currentPage + 1 })
              }
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span className="hidden sm:inline">
                {locale === "ar" ? "التالي" : "Next"}
              </span>
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
