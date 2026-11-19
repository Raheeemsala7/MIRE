"use client";

import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useLogin } from "../../hooks/use-login";
import { PasswordInput } from "../password-input";

export function LoginForm() {
  const t = useTranslations();
  const { form, onSubmit, serverError, isPending } = useLogin();
  const { control } = form;

  return (
    <form
      className="mt-9 space-y-5"
      onSubmit={onSubmit}
      aria-busy={isPending}
      noValidate
    >
      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-ds-elevated px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              htmlFor="login-email"
              className="text-sm font-medium text-ds-text-plain"
            >
              {t("login-email-label")}
            </FieldLabel>
            <Input
              {...field}
              id="login-email"
              disabled={isPending}
              aria-required="true"
              dir="ltr"
              autoCapitalize="none"
              spellCheck={false}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.error ? "login-email-error" : undefined
              }
              className="h-12 rounded-xl border-ds-border-muted bg-ds-elevated px-4 text-base focus-visible:ring-ds-primary"
            />
            {fieldState.error && (
              <FieldError id="login-email-error">
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              htmlFor="login-password"
              className="text-sm font-medium text-ds-text-plain"
            >
              {t("login-password-label")}
            </FieldLabel>
            <PasswordInput
              {...field}
              id="login-password"
              autoComplete="current-password"
              placeholder={t("login-password-required")}
              showLabel={t("register-password-show")}
              hideLabel={t("register-password-hide")}
              disabled={isPending}
              aria-required="true"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? "login-password-error" : undefined}
              className="h-12 rounded-xl border-ds-border-muted bg-ds-elevated px-4 text-base focus-visible:ring-ds-primary"
            />
            {fieldState.error && (
              <FieldError id="login-password-error">
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />
      <Controller
        name="rememberMe"
        control={control}
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ds-text-muted">
            <input
              type="checkbox"
              disabled={isPending}
              name={field.name}
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
              ref={field.ref}
              className="size-4 accent-ds-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
            />
            {t("login-remember")}
          </label>
        )}
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(92,73,96,.8)] transition-all hover:-translate-y-0.5 hover:bg-ds-primary-saturated focus-visible:ring-ds-primary"
      >
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> {t("login-submitting")}
          </>
        ) : (
          <>
            {t("login-submit")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </>
        )}
      </Button>
      <p className="pt-2 text-center text-sm text-ds-text-muted">
        {t("login-register-prompt")}{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-ds-text-primary underline-offset-4 hover:underline"
        >
          {t("login-register-link")}
        </Link>
      </p>
    </form>
  );
}
