"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Button } from "@/shared/components/ui/button";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";
import { resetPasswordAction } from "../actions/reset-password";
import { createResetPasswordSchema, type ResetPasswordFields } from "../schemas/password.schema";

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token = "" }: ResetPasswordFormProps) {
  const t = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(!token);

  const form = useForm<ResetPasswordFields>({
    resolver: zodResolver(createResetPasswordSchema(t)),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const { control, formState: { isSubmitting } } = form;
  const currentPassword = useWatch({ control, name: "password", defaultValue: "" });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await resetPasswordAction(values);
      if (!result.success) {
        if (result.error === "reset-error-invalid-token") {
          setIsTokenExpired(true);
        } else {
          setServerError(t(result.error));
        }
        return;
      }
      setIsSuccess(true);
    } catch {
      setServerError(t("reset-error-unavailable"));
    }
  });

  // State 1: Invalid or expired reset token
  if (isTokenExpired) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm ring-1 ring-destructive/20">
          <AlertCircle className="size-7" aria-hidden="true" />
        </div>

        <div>
          <h2 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {t("reset-expired-title")}
          </h2>
          <p className="mt-3 text-base leading-7 text-ds-text-muted">
            {t("reset-expired-description")}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            asChild
            className="h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(92,73,96,.8)] transition-all hover:-translate-y-0.5 hover:bg-ds-primary-saturated focus-visible:ring-ds-primary"
          >
            <Link href="/auth/forgot-password">
              <RotateCcw className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("reset-request-new-link")}
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="h-12 w-full rounded-xl text-sm font-medium text-ds-text-muted hover:bg-ds-subtle hover:text-ds-text-primary"
          >
            <Link href="/auth/login">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("reset-back-to-login")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Success state after reset
  if (isSuccess) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>

        <div>
          <h2 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {t("reset-success-title")}
          </h2>
          <p className="mt-3 text-base leading-7 text-ds-text-muted">
            {t("reset-success-description")}
          </p>
        </div>

        <div className="pt-2">
          <Button
            asChild
            className="h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(92,73,96,.8)] transition-all hover:-translate-y-0.5 hover:bg-ds-primary-saturated focus-visible:ring-ds-primary"
          >
            <Link href="/auth/login">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("reset-success-login-btn")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 3: Password Reset Form
  return (
    <form
      className="mt-9 space-y-5"
      onSubmit={onSubmit}
      aria-busy={isSubmitting}
      noValidate
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
        <KeyRound className="size-7" aria-hidden="true" />
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-ds-elevated px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      {/* New Password */}
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              htmlFor="reset-password"
              className="text-sm font-medium text-ds-text-plain"
            >
              {t("reset-password-label")}
            </FieldLabel>
            <PasswordInput
              {...field}
              id="reset-password"
              autoComplete="new-password"
              placeholder={t("reset-password-placeholder")}
              showLabel={t("register-password-show")}
              hideLabel={t("register-password-hide")}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.error ? "reset-password-error" : undefined
              }
              className="h-12 rounded-xl border-ds-border-muted bg-ds-elevated px-4 text-base focus-visible:ring-ds-primary"
            />
            {fieldState.error && (
              <FieldError id="reset-password-error">
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      {/* Password Strength Indicator */}
      <PasswordStrength password={currentPassword} />

      {/* Confirm Password */}
      <Controller
        name="confirmPassword"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              htmlFor="reset-confirm-password"
              className="text-sm font-medium text-ds-text-plain"
            >
              {t("reset-confirm-label")}
            </FieldLabel>
            <PasswordInput
              {...field}
              id="reset-confirm-password"
              autoComplete="new-password"
              placeholder={t("reset-confirm-placeholder")}
              showLabel={t("register-password-show")}
              hideLabel={t("register-password-hide")}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.error ? "reset-confirm-password-error" : undefined
              }
              className="h-12 rounded-xl border-ds-border-muted bg-ds-elevated px-4 text-base focus-visible:ring-ds-primary"
            />
            {fieldState.error && (
              <FieldError id="reset-confirm-password-error">
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(92,73,96,.8)] transition-all hover:-translate-y-0.5 hover:bg-ds-primary-saturated focus-visible:ring-ds-primary"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{" "}
            {t("reset-submitting")}
          </>
        ) : (
          <>
            {t("reset-submit")}{" "}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </>
        )}
      </Button>

      {/* Back to login link */}
      <p className="pt-2 text-center text-sm text-ds-text-muted">
        <Link
          href="/auth/login"
          className="font-semibold text-ds-text-primary underline-offset-4 hover:underline"
        >
          {t("reset-back-to-login")}
        </Link>
      </p>
    </form>
  );
}
