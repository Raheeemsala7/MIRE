"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { registerAction } from "../actions/register";
import { createRegisterSchema, type RegistrationFields } from "../schemas/register.schema";

const FIELD_NAMES = ["name", "email", "phone", "password"] as const;

export function useRegister() {
  const t = useTranslations();
  const mutation = useMutation({
    mutationFn: registerAction,
    retry: false,
    gcTime: 0,
    onSuccess: (result) => {
      if (!result.success) toast.error(t(result.error));
    },
    onError: () => toast.error(t("register-error-unknown")),
  });

  const [isRegistered, setIsRegistered] = useState(false);

  const form = useForm<RegistrationFields>({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: { name: "", email: "", phone: "", password: "" },
    mode: "onTouched",
  });

  const isPending = mutation.isPending || form.formState.isSubmitting;
  const serverError = mutation.isError
    ? t("register-error-unknown")
    : mutation.data && !mutation.data.success
      ? t(mutation.data.error)
      : null;

  async function onSubmit(values: RegistrationFields): Promise<void> {
    if (mutation.isPending) return;
    mutation.reset();

    try {
      const result = await mutation.mutateAsync(values);

      if (result.success) {
        form.reset();
        mutation.reset();
        setIsRegistered(true);
        return;
      }

      let firstInvalidField: keyof RegistrationFields | undefined;

      for (const name of FIELD_NAMES) {
        const message = result.fieldErrors?.[name]?.[0];

        if (message) {
          form.setError(name, { type: "server", message: t(message) });
          firstInvalidField ??= name;
        }
      }

      if (firstInvalidField) {
        const fieldToFocus = firstInvalidField;
        requestAnimationFrame(() => form.setFocus(fieldToFocus));
      }
    } catch {
      // The mutation hook owns exception feedback and the inline error state.
    }
  }

  return { form, onSubmit: form.handleSubmit(onSubmit), isPending, isRegistered, serverError };
}
