"use client";

import { useQuery } from "@tanstack/react-query";
import type { Employee } from "../types/employee.types";
import { fetchEmployeeById } from "../services/employees.service";
import { employeeQueryKeys } from "./use-employees";

export function useEmployee(id: string, initialData?: Employee) {
  return useQuery({
    queryKey: employeeQueryKeys.detail(id),
    queryFn: async () => {
      const res = await fetchEmployeeById(id);
      return res.data;
    },
    initialData,
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}
