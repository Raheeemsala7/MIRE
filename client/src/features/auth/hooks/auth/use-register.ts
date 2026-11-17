"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { registerAction } from "@/features/auth/lib/actions/auth.action";
import type { RegistrationFields } from "@/features/auth/lib/schemes/auth.schema";
import type { RegistrationResult } from "@/features/auth/lib/types/auth";

export function useRegister(): UseMutationResult<
  RegistrationResult,
  Error,
  RegistrationFields
> {
  // Translation
  const t = useTranslations();

  // Mutation
  return useMutation({
    mutationFn: registerAction,
    retry: false,
    gcTime: 0,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(t(result.error));
      }
      console.log(result);
      
    },
    onError: () => {
      toast.error(t("register-error-unknown"));
    },
  });
}
