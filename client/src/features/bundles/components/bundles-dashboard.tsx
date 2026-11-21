"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Plus, BadgePercent } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { useBundles } from "../hooks/use-bundles";
import { useToggleBundleStatus } from "../hooks/use-toggle-bundle-status";
import { BundlesOverview } from "./bundles-overview";
import { BundlesTable } from "./bundles-table";
import { DeleteBundleDialog } from "./delete-bundle-dialog";
import { filterBundlesClientSide } from "../utils/bundle.util";
import type {
  Bundle,
  BundleFilters,
  BundlesPaginatedResponse,
  BundleOverviewStats,
} from "../types/bundle.types";
import type { SafeUser } from "@/lib/auth/types";

interface BundlesDashboardProps {
  initialData?: BundlesPaginatedResponse;
  initialFilters?: BundleFilters;
  stats: BundleOverviewStats;
  currentUser: SafeUser | null;
  locale: string;
}

export function BundlesDashboard({
  initialData,
  initialFilters,
  stats,
  currentUser,
  locale,
}: BundlesDashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPendingTransition, startTransition] = React.useTransition();

  // URL searchParams as source of initial filters
  const [filters, setFilters] = React.useState<BundleFilters>(() => {
    return {
      page: Number(searchParams.get("page")) || initialFilters?.page || 1,
      limit: Number(searchParams.get("limit")) || initialFilters?.limit || 20,
      search: searchParams.get("search") ?? initialFilters?.search ?? undefined,
      type: (searchParams.get("type") as BundleFilters["type"]) ?? initialFilters?.type ?? undefined,
      status: (searchParams.get("status") as BundleFilters["status"]) ?? initialFilters?.status ?? undefined,
      sortBy: searchParams.get("sortBy") ?? initialFilters?.sortBy ?? undefined,
    };
  });

  const [deletingBundle, setDeletingBundle] = React.useState<Bundle | null>(null);

  const { data: queryData, isFetching } = useBundles(
    filters,
    initialData,
    initialFilters
  );

  const { mutate: toggleStatus } = useToggleBundleStatus(() => {
    router.refresh();
  });

  const rawBundles = React.useMemo(
    () => queryData?.data ?? initialData?.data ?? [],
    [queryData?.data, initialData?.data]
  );
  const rawPagination = queryData?.meta ?? initialData?.meta;

  // Accurately scope client-side filtering over the loaded data for backend-unsupported filters
  const filteredBundles = React.useMemo(() => {
    return filterBundlesClientSide(rawBundles, filters);
  }, [rawBundles, filters]);

  // Adjust pagination metadata when client-side filters are active
  const effectivePagination = React.useMemo(() => {
    if (!rawPagination) return undefined;
    const isFiltered = Boolean(
      (filters.search && filters.search.trim()) ||
        (filters.type && (filters.type as string) !== "ALL") ||
        (filters.status && filters.status !== "ALL")
    );
    if (!isFiltered) return rawPagination;
    return {
      ...rawPagination,
      total: filteredBundles.length,
      totalPages: Math.max(1, Math.ceil(filteredBundles.length / (rawPagination.limit || 20))),
      hasNextPage: false,
      hasPrevPage: false,
    };
  }, [rawPagination, filteredBundles.length, filters.search, filters.type, filters.status]);

  const updateUrlAndFilters = React.useCallback(
    (newFilters: Partial<BundleFilters>) => {
      setFilters((prev) => {
        const merged: BundleFilters = { ...prev, ...newFilters };
        const params = new URLSearchParams();

        if (merged.page && merged.page > 1) {
          params.set("page", String(merged.page));
        }
        if (merged.limit && merged.limit !== 20) {
          params.set("limit", String(merged.limit));
        }
        if (merged.search && merged.search.trim()) {
          params.set("search", merged.search.trim());
        }
        if (merged.type) {
          params.set("type", merged.type);
        }
        if (merged.status && merged.status !== "ALL") {
          params.set("status", merged.status);
        }
        if (merged.sortBy) {
          params.set("sortBy", merged.sortBy);
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

  const canCreate = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_CREATE,
    currentUser?.permissions
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BadgePercent className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
              {t("bundle-page-title") || "Bundles & Offers"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ps-10">
            {t("bundle-page-description") ||
              "Manage product bundles, promotions, discounts, and special offers."}
          </p>
        </div>

        {canCreate && (
          <Button asChild className="gap-2 text-xs">
            <Link href="/admin/bundles/new">
              <Plus className="size-4" />
              <span>{t("bundle-btn-add") || "Create Bundle or Offer"}</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Overview Metric Cards */}
      <BundlesOverview stats={stats} />

      {/* Main Table */}
      <BundlesTable
        bundles={filteredBundles}
        pagination={effectivePagination}
        filters={filters}
        onFilterChange={updateUrlAndFilters}
        currentUser={currentUser}
        locale={locale}
        isFetching={isFetching || isPendingTransition}
        onDelete={(b) => setDeletingBundle(b)}
        onToggleStatus={(b, nextActive) => toggleStatus({ id: b._id, isActive: nextActive })}
      />

      {/* Delete Dialog */}
      <DeleteBundleDialog
        bundle={deletingBundle}
        open={Boolean(deletingBundle)}
        onOpenChange={(open) => !open && setDeletingBundle(null)}
        onSuccess={() => {
          setDeletingBundle(null);
          router.refresh();
        }}
      />
    </div>
  );
}
