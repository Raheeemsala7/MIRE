"use client";

import React, { useState, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { SafeUser } from "@/lib/auth/types";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import type {
  ReturnsFilterParams,
  ReturnsPaginatedResponse,
  ReturnsOverviewStats,
} from "../../types/return.types";
import { useReturns, useReturnsStats } from "../../hooks/use-returns";
import { ReturnsOverview } from "./returns-overview";
import { ReturnsFilters } from "./returns-filters";
import { ReturnsTable } from "./returns-table";
import { ReturnsTableSkeleton } from "../shared/return-skeleton";

interface ReturnsDashboardProps {
  initialData?: ReturnsPaginatedResponse;
  initialStats?: { success: boolean; data: ReturnsOverviewStats };
  locale: string;
  currentUser?: SafeUser;
}

export function ReturnsDashboard({
  initialData,
  initialStats,
  locale,
  currentUser,
}: ReturnsDashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPendingTransition, startTransition] = useTransition();

  const canCreateReturn = currentUser
    ? can(currentUser.role, PERMISSIONS.RETURNS_CREATE, currentUser.permissions)
    : false;

  // URL searchParams as initial state
  const [filters, setFilters] = useState<ReturnsFilterParams>({
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 20,
    status: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
  });

  const { data, isLoading, isFetching } = useReturns(filters, initialData);
  const { data: statsData } = useReturnsStats(initialStats);
  const stats = statsData?.data;

  const updateUrlAndFilters = useCallback(
    (newFilters: Partial<ReturnsFilterParams>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...newFilters };
        const params = new URLSearchParams();

        if (merged.page && merged.page > 1) {
          params.set("page", String(merged.page));
        }
        if (merged.status && merged.status !== "ALL") {
          params.set("status", merged.status);
        }
        if (merged.search && merged.search.trim()) {
          params.set("search", merged.search.trim());
        }

        const query = params.toString();
        startTransition(() => {
          router.replace(`${pathname}${query ? `?${query}` : ""}`);
        });

        return merged;
      });
    },
    [pathname, router]
  );

  const handleFilterChange = useCallback(
    (changed: Partial<ReturnsFilterParams>) => {
      updateUrlAndFilters(changed);
    },
    [updateUrlAndFilters]
  );

  const handleReset = useCallback(() => {
    updateUrlAndFilters({
      page: 1,
      status: undefined,
      search: undefined,
      assignedEmployee: undefined,
    });
  }, [updateUrlAndFilters]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateUrlAndFilters({ page: newPage });
    },
    [updateUrlAndFilters]
  );

  const returnsList = data?.data || [];
  const totalCount = data?.total || 0;
  const currentPage = data?.page || filters.page || 1;
  const currentLimit = data?.limit || filters.limit || 20;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("returns-title") || "Returns Management"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("returns-description") ||
              "Manage return requests, customer follow-ups, inspections, and inventory restocking."}
          </p>
        </div>

        {canCreateReturn && (
          <Link
            href="/admin/returns/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 shrink-0"
          >
            <Plus className="size-4" />
            <span>{t("returns-create-button") || "Create Return"}</span>
          </Link>
        )}
      </div>

      {/* Overview Cards */}
      <ReturnsOverview
        stats={stats}
        locale={locale}
      />

      {/* Filters */}
      <ReturnsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        locale={locale}
        isPending={isPendingTransition || isFetching}
      />

      {/* Returns Table */}
      {isLoading && !data ? (
        <ReturnsTableSkeleton />
      ) : (
        <ReturnsTable
          returns={returnsList}
          total={totalCount}
          page={currentPage}
          limit={currentLimit}
          onPageChange={handlePageChange}
          locale={locale}
          isPending={isPendingTransition || isFetching}
        />
      )}
    </div>
  );
}
