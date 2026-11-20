"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  EmployeeFilters,
  EmployeesPaginatedResponse,
} from "../types/employee.types";
import { fetchEmployees } from "../services/employees.service";

export const employeeQueryKeys = {
  all: ["admin", "employees"] as const,
  lists: () => [...employeeQueryKeys.all, "list"] as const,
  list: (filters: EmployeeFilters) => [...employeeQueryKeys.lists(), filters] as const,
  details: () => [...employeeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
};

export function useEmployees(
  filters: EmployeeFilters = {},
  initialData?: EmployeesPaginatedResponse
) {
  const isDefaultFilter =
    Boolean(initialData) &&
    !filters.search &&
    (!filters.page || Number(filters.page) === 1) &&
    (!filters.limit || Number(filters.limit) === 20) &&
    !filters.role &&
    (filters.isActive === undefined || filters.isActive === "") &&
    (!filters.sort || filters.sort === "-createdAt");

  return useQuery({
    queryKey: employeeQueryKeys.list(filters),
    queryFn: () => fetchEmployees(filters),
    initialData: isDefaultFilter ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
}
