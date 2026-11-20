"use client";

import { useQuery } from "@tanstack/react-query";
import type { CustomerDetailsResponse } from "../types/customer.types";
import { fetchCustomerById } from "../services/customers.service";
import { customerQueryKeys } from "./use-customers";

export function useCustomer(
  id: string,
  initialData?: CustomerDetailsResponse
) {
  return useQuery({
    queryKey: customerQueryKeys.detail(id),
    queryFn: () => fetchCustomerById(id),
    initialData,
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}
