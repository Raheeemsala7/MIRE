"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "../actions/login";
import { createLoginSchema, type LoginFields } from "../schemas/login.schema";

export function useLogin() {
  const t = useTranslations();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const form = useForm<LoginFields>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await loginAction(values);
      if (!result.success) {
        setServerError(t(`login-error-${result.error}`));
        return;
      }
      setIsRedirecting(true);
      // The destination can use a different root layout; a full navigation
      // also discards the password and the previous account's client caches.
      router.replace(result.destination);
    } catch {
      setIsRedirecting(false);
      setServerError(t("login-error-unavailable"));
    }
  });

  return { form, onSubmit, serverError, isPending: form.formState.isSubmitting || isRedirecting };
}
