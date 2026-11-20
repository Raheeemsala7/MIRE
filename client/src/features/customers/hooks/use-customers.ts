"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  CustomerFilters,
  CustomersPaginatedResponse,
} from "../types/customer.types";
import { fetchCustomers } from "../services/customers.service";

export const customerQueryKeys = {
  all: ["admin", "customers"] as const,
  lists: () => [...customerQueryKeys.all, "list"] as const,
  list: (filters: CustomerFilters) =>
    [...customerQueryKeys.lists(), filters] as const,
  details: () => [...customerQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...customerQueryKeys.details(), id] as const,
};

export function useCustomers(
  filters: CustomerFilters = {},
  initialData?: CustomersPaginatedResponse
) {
  const isDefaultFilter =
    Boolean(initialData) &&
    !filters.search &&
    (!filters.page || Number(filters.page) === 1) &&
    (!filters.limit || Number(filters.limit) === 20) &&
    (!filters.sortBy || filters.sortBy === "createdAt:desc");

  return useQuery({
    queryKey: customerQueryKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
    initialData: isDefaultFilter ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
}
