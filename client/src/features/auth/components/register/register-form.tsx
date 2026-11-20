"use client";

import type { ReactNode } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { useRegister } from "@/features/auth/hooks/use-register";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { PasswordInput } from "../password-input";
import NextLink from "next/link";

const INPUT_CLASS_NAME =
  "h-12 rounded-lg border-ds-border-muted bg-ds-elevated px-4 text-base text-ds-text-plain shadow-none placeholder:text-ds-text-muted caret-ds-primary aria-invalid:border-destructive focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ds-plain disabled:opacity-60";

export function RegisterForm(): ReactNode {
  // Translation
  const t = useTranslations();

  const { form, onSubmit, isPending, isRegistered, serverError } = useRegister();

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
        <NextLink
          href="/auth/login"
          className="inline-flex min-h-12 items-center gap-3 rounded-full bg-ds-primary px-7 py-3 text-sm font-medium text-ds-text-inverse transition-colors hover:bg-ds-primary-saturated focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary"
        >
          {t("login-submit")}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </NextLink>
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

      <form
        onSubmit={onSubmit}
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
              <PasswordInput
                {...field}
                id="register-password"
                autoComplete="new-password"
                placeholder={t("register-password-placeholder")}
                showLabel={t("register-password-show")}
                hideLabel={t("register-password-hide")}
                disabled={isPending}
                aria-required="true"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? "register-password-hint register-password-error" : "register-password-hint"}
                className={INPUT_CLASS_NAME}
              />
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

      <p className="mt-7 text-center text-sm leading-6 text-ds-text-muted">
        {t("register-login-prompt")}{" "}
        <NextLink
          href="/auth/login"
          className="rounded-sm font-medium text-ds-text-primary underline underline-offset-4 hover:text-ds-text-plain focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary"
        >
          {t("login-submit")}
        </NextLink>
      </p>
    </div>
  );
}
