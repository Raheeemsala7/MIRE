"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { useProducts } from "../../hooks/use-products";
import { ProductsOverview } from "./products-overview";
import { ProductsTable } from "./products-table";
import { ArchiveProductDialog } from "./archive-product-dialog";
import type {
  Product,
  ProductFilters,
  ProductsPaginatedResponse,
  ProductOverviewStats,
  CategoryItem,
} from "../../types/product.types";
import type { SafeUser } from "@/lib/auth/types";

interface ProductsDashboardProps {
  initialData?: ProductsPaginatedResponse;
  initialFilters?: ProductFilters;
  stats: ProductOverviewStats;
  categories: CategoryItem[];
  currentUser: SafeUser | null;
  locale: string;
}

export function ProductsDashboard({
  initialData,
  initialFilters,
  stats,
  categories,
  currentUser,
  locale,
}: ProductsDashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPendingTransition, startTransition] = React.useTransition();

  // URL searchParams as source of initial filters
  const [filters, setFilters] = React.useState<ProductFilters>(() => {
    return {
      page: Number(searchParams.get("page")) || initialFilters?.page || 1,
      limit: Number(searchParams.get("limit")) || initialFilters?.limit || 20,
      search: searchParams.get("search") ?? initialFilters?.search ?? undefined,
      category: searchParams.get("category") ?? initialFilters?.category ?? undefined,
      status: (searchParams.get("status") as ProductFilters["status"]) ?? initialFilters?.status ?? undefined,
      sortBy: searchParams.get("sortBy") ?? initialFilters?.sortBy ?? undefined,
    };
  });

  const [archivingProduct, setArchivingProduct] = React.useState<Product | null>(null);

  const { data: queryData, isFetching } = useProducts(
    filters,
    initialData,
    initialFilters
  );

  const products = queryData?.data ?? initialData?.data ?? [];
  const pagination = queryData?.meta ?? initialData?.meta;

  const updateUrlAndFilters = React.useCallback(
    (newFilters: Partial<ProductFilters>) => {
      setFilters((prev) => {
        const merged: ProductFilters = { ...prev, ...newFilters };
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
        if (merged.category) {
          params.set("category", merged.category);
        }
        if (merged.status) {
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
    PERMISSIONS.PRODUCTS_CREATE,
    currentUser?.permissions
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            {t("products-title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t("products-subtitle")}
          </p>
        </div>

        {canCreate && (
          <Button asChild className="gap-2 text-xs">
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              <span>{t("products-btn-add")}</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Overview Metric Cards */}
      <ProductsOverview stats={stats} />

      {/* Main Products Table */}
      <ProductsTable
        products={products}
        pagination={pagination}
        filters={filters}
        categories={categories}
        onFilterChange={updateUrlAndFilters}
        currentUser={currentUser}
        locale={locale}
        isFetching={isFetching || isPendingTransition}
        onArchive={(p) => setArchivingProduct(p)}
      />

      {/* Archive Product Confirmation Dialog */}
      <ArchiveProductDialog
        product={archivingProduct}
        open={Boolean(archivingProduct)}
        onOpenChange={(open) => !open && setArchivingProduct(null)}
        onSuccess={() => {
          setArchivingProduct(null);
          router.refresh();
        }}
      />
    </div>
  );
}
