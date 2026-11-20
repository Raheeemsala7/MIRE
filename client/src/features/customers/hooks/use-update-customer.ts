"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  UpdateCustomerPayload,
  SingleCustomerResponse,
  CustomerDetailsResponse,
} from "../types/customer.types";
import { updateCustomer } from "../services/customers.service";
import { customerQueryKeys } from "./use-customers";

interface UpdateCustomerVariables {
  id: string;
  payload: UpdateCustomerPayload;
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation<SingleCustomerResponse, Error, UpdateCustomerVariables>({
    mutationFn: ({ id, payload }: UpdateCustomerVariables) =>
      updateCustomer(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData<CustomerDetailsResponse>(
        customerQueryKeys.detail(variables.id),
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              customer: {
                ...old.data.customer,
                ...response.data,
              },
            },
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.detail(variables.id),
      });
      toast.success(
        t("customers-update-success") || "Customer updated successfully"
      );
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("customers-update-error") ||
          "Failed to update customer"
      );
    },
  });
}
