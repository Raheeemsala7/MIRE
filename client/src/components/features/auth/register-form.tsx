"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { useRegister } from "@/features/auth/hooks/auth/use-register";
import { Link } from "@/src/i18n/navigation";
import {
  createRegisterSchema,
  type RegistrationFields,
} from "@/features/auth/lib/schemes/auth.schema";
import { Button } from "@/src/shared/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/src/shared/components/ui/field";
import {
  Form,
} from "@/src/shared/components/ui/form";
import { Input } from "@/src/shared/components/ui/input";
import { cn } from "@/src/shared/lib/utils";

const INPUT_CLASS_NAME =
  "h-12 rounded-lg border-ds-border-muted bg-ds-elevated px-4 text-base text-ds-text-plain shadow-none placeholder:text-ds-text-muted caret-ds-primary aria-invalid:border-destructive focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ds-plain disabled:opacity-60";
const FIELD_NAMES = ["name", "email", "phone", "password"] as const;

export function RegisterForm(): ReactNode {
  // Translation
  const t = useTranslations();

  // State
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Mutation
  const mutation = useRegister();

  // Form & validation
  const form = useForm<RegistrationFields>({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: { name: "", email: "", phone: "", password: "" },
    mode: "onTouched",
  });

  // Variables
  const isPending = mutation.isPending || form.formState.isSubmitting;
  const serverError = mutation.isError
    ? t("register-error-unknown")
    : mutation.data && !mutation.data.success
      ? t(mutation.data.error)
      : null;

  // Functions
  async function onSubmit(values: RegistrationFields): Promise<void> {
    if (mutation.isPending) return;
    mutation.reset();

    try {
      const result = await mutation.mutateAsync(values);

      if (result.success) {
        form.reset();
        mutation.reset();
        setShowPassword(false);
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

  if (isRegistered) {
    return (
      <div className="space-y-6 py-12" role="status" aria-live="polite">
        <span className="flex size-14 items-center justify-center rounded-full bg-ds-secondary-faint text-ds-text-primary">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-3">
          <h1 className="text-4xl font-normal leading-tight sm:text-5xl">
            {t("register-success-title")}
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-ds-text-muted">
            {t("register-success-description")}
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex min-h-12 items-center gap-3 rounded-full bg-ds-primary px-7 py-3 text-sm font-medium text-ds-text-inverse transition-colors hover:bg-ds-primary-saturated focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary"
        >
          {t("register-explore")}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-normal leading-tight sm:text-5xl">
          {t("register-title")}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-ds-text-muted sm:text-base">
          {t("register-description")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          aria-busy={isPending}
          className="space-y-5"
        >
          {/* Full name */}
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-name" className="text-sm font-medium">
                  {t("register-name-label")}
                </FieldLabel>
                <Input {...field} id="register-name" autoComplete="name" placeholder={t("register-name-placeholder")} maxLength={100} disabled={isPending} aria-required="true" aria-invalid={fieldState.invalid} aria-describedby={fieldState.invalid ? "register-name-error" : undefined} className={INPUT_CLASS_NAME} />
                {fieldState.invalid && <FieldError id="register-name-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Email */}
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-email" className="text-sm font-medium">
                  {t("register-email-label")}
                </FieldLabel>
                <Input {...field} id="register-email" type="email" dir="ltr" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder={t("register-email-placeholder")} disabled={isPending} aria-required="true" aria-invalid={fieldState.invalid} aria-describedby={fieldState.invalid ? "register-email-error" : undefined} className={INPUT_CLASS_NAME} />
                {fieldState.invalid && <FieldError id="register-email-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Phone */}
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-phone" className="text-sm font-medium">
                  {t("register-phone-label")}{" "}
                  <span className="ms-1 font-normal text-ds-text-muted">
                    {t("register-optional")}
                  </span>
                </FieldLabel>
                <Input {...field} id="register-phone" type="tel" dir="ltr" autoComplete="tel" placeholder={t("register-phone-placeholder")} disabled={isPending} aria-invalid={fieldState.invalid} aria-describedby={fieldState.invalid ? "register-phone-error" : undefined} className={INPUT_CLASS_NAME} />
                {fieldState.invalid && <FieldError id="register-phone-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Password */}
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-password" className="text-sm font-medium">
                  {t("register-password-label")}
                </FieldLabel>
                <div className="relative">
                    <Input
               {...field}
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder={t("register-password-placeholder")}
                      disabled={isPending}
                      aria-required="true"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? "register-password-hint register-password-error" : "register-password-hint"}
                      className={cn(INPUT_CLASS_NAME, "pe-14")}
                    />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    aria-label={
                      showPassword
                        ? t("register-password-hide")
                        : t("register-password-show")
                    }
                    aria-pressed={showPassword}
                    className="absolute inset-y-1 end-1 flex w-10 items-center justify-center rounded-md text-ds-text-muted transition-colors hover:bg-ds-subtle hover:text-ds-text-primary focus-visible:outline-2 focus-visible:outline-ds-primary disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <FieldDescription id="register-password-hint" className="text-xs leading-5 text-ds-text-muted">
                  {t("register-password-hint")}
                </FieldDescription>
                {fieldState.invalid && <FieldError id="register-password-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {serverError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-ds-elevated p-4 text-sm leading-6 text-destructive"
            >
              {serverError}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full gap-3 rounded-full bg-ds-primary text-sm font-medium text-ds-text-inverse shadow-none transition-colors hover:bg-ds-primary-saturated focus-visible:ring-ds-primary focus-visible:ring-offset-ds-plain"
          >
            {isPending ? (
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {isPending ? t("register-submitting") : t("register-submit")}
            {!isPending && (
              <ArrowRight
                className="size-4 rtl:rotate-180"
                aria-hidden="true"
              />
            )}
          </Button>
          <span role="status" className="sr-only">
            {isPending ? t("register-submitting") : ""}
          </span>
        </form>
      </Form>

      <p className="mt-7 text-center text-sm leading-6 text-ds-text-muted">
        {t("register-browse-prompt")}{" "}
        <Link
          href="/products"
          className="rounded-sm font-medium text-ds-text-primary underline underline-offset-4 hover:text-ds-text-plain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary"
        >
          {t("register-browse-link")}
        </Link>
      </p>
    </div>
  );
}
