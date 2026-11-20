"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useCustomers } from "../hooks/use-customers";
import { CustomersHeader } from "./customers-header";
import { CustomersOverview } from "./customers-overview";
import { CustomersTable } from "./customers-table";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { CustomersSkeleton } from "./customer-skeleton";
import { calculateCustomerMetrics } from "../utils/customer.util";
import type {
  Customer,
  CustomerFilters,
  CustomersPaginatedResponse,
} from "../types/customer.types";
import type { SafeUser } from "@/lib/auth/types";

interface CustomersDashboardProps {
  initialData?: CustomersPaginatedResponse;
  locale: string;
  currentUser: SafeUser | null;
}

export function CustomersDashboard({
  initialData,
  locale,
  currentUser,
}: CustomersDashboardProps) {
  // Navigation
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [editTab, setEditTab] = React.useState<"profile" | "tags" | "notes">("profile");

  // Variables
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limitParam = parseInt(searchParams.get("limit") || "20", 10) || 20;
  const sortByParam = searchParams.get("sortBy") || "createdAt:desc";

  const filters = React.useMemo<CustomerFilters>(() => ({
    search: searchParam.trim() ? searchParam.trim() : undefined,
    page: pageParam,
    limit: limitParam,
    sortBy: sortByParam,
  }), [searchParam, pageParam, limitParam, sortByParam]);

  // Queries
  const { data, isLoading, isFetching, refetch } = useCustomers(
    filters,
    initialData
  );

  const customers = React.useMemo(() => data?.data || [], [data?.data]);
  const pagination = data?.meta;

  const metrics = React.useMemo(() => {
    return calculateCustomerMetrics(customers, pagination);
  }, [customers, pagination]);

  // Functions
  const handleFilterChange = React.useCallback(
    (newFilters: CustomerFilters) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newFilters.search && newFilters.search.trim()) {
        params.set("search", newFilters.search.trim());
      } else {
        params.delete("search");
      }

      if (newFilters.page && newFilters.page > 1) {
        params.set("page", String(newFilters.page));
      } else {
        params.delete("page");
      }

      if (newFilters.limit && newFilters.limit !== 20) {
        params.set("limit", String(newFilters.limit));
      } else {
        params.delete("limit");
      }

      if (newFilters.sortBy && newFilters.sortBy !== "createdAt:desc") {
        params.set("sortBy", newFilters.sortBy);
      } else {
        params.delete("sortBy");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  function handleEdit(customer: Customer, tab: "profile" | "tags" | "notes" = "profile") {
    setSelectedCustomer(customer);
    setEditTab(tab);
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <CustomersHeader
        totalCount={pagination?.total}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {/* Metrics Overview */}
      <CustomersOverview metrics={metrics} />

      {/* Table / Skeleton */}
      {isLoading && customers.length === 0 ? (
        <CustomersSkeleton />
      ) : (
        <CustomersTable
          customers={customers}
          pagination={pagination}
          filters={filters}
          onFilterChange={handleFilterChange}
          currentUser={currentUser}
          locale={locale}
          isFetching={isFetching}
          onEdit={handleEdit}
        />
      )}

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={selectedCustomer}
        initialTab={editTab}
      />
    </div>
  );
}
