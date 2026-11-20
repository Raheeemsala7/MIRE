"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { forgotPasswordAction } from "../actions/forgot-password";
import { createForgotPasswordSchema, type ForgotPasswordFields } from "../schemas/password.schema";

const STORAGE_EXPIRY_KEY = "mire_forgot_cooldown_expiry";
const STORAGE_EMAIL_KEY = "mire_forgot_cooldown_email";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}${"*".repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
}

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<ForgotPasswordFields>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: { email: "" },
  });

  const { control, formState: { isSubmitting } } = form;

  // Restore cooldown and countdown accurately across page refreshes
  useEffect(() => {
    function updateRemaining() {
      try {
        const storedExpiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
        const storedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);
        if (storedExpiry) {
          const expiry = Number(storedExpiry);
          const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
          setCooldown(remaining);
          if (remaining > 0) {
            if (storedEmail) {
              setSubmittedEmail(storedEmail);
            }
          } else {
            localStorage.removeItem(STORAGE_EXPIRY_KEY);
          }
        }
      } catch {
        // Storage access might be restricted
      }
    }

    const timer = setTimeout(updateRemaining, 0);
    const interval = setInterval(updateRemaining, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    void form.handleSubmit(async (values) => {
      if (cooldown > 0) {
        setServerError(t("forgot-resend-cooldown", { seconds: cooldown }));
        return;
      }

      setServerError(null);
      try {
        const result = await forgotPasswordAction(values);
        if (!result.success) {
          setServerError(t(result.error));
          return;
        }
        const expiry = Date.now() + 60_000;
        try {
          localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiry));
          localStorage.setItem(STORAGE_EMAIL_KEY, values.email);
        } catch {
          // Storage access might be restricted
        }
        setSubmittedEmail(values.email);
        setCooldown(60);
      } catch {
        setServerError(t("forgot-error-unavailable"));
      }
    })(event);
  }

  const handleResend = async () => {
    if (cooldown > 0 || !submittedEmail || isResending) return;
    setIsResending(true);
    setServerError(null);
    try {
      const result = await forgotPasswordAction({ email: submittedEmail });
      if (!result.success) {
        setServerError(t(result.error));
      } else {
        const expiry = Date.now() + 60_000;
        try {
          localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiry));
        } catch {
          // Storage access might be restricted
        }
        setCooldown(60);
      }
    } catch {
      setServerError(t("forgot-error-unavailable"));
    } finally {
      setIsResending(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
          <Mail className="size-7" aria-hidden="true" />
        </div>

        <div>
          <h2 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
            {t("forgot-success-title")}
          </h2>
          <p className="mt-3 text-base leading-7 text-ds-text-muted">
            {t("forgot-success-description")}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ds-border-muted bg-ds-elevated px-4 py-2.5 text-sm font-medium text-ds-text-plain">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-500" aria-hidden="true" />
            <span dir="ltr" className="select-all font-mono text-xs sm:text-sm">
              {maskEmail(submittedEmail)}
            </span>
          </div>
        </div>

        {serverError && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/25 bg-ds-elevated px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <div className="space-y-4 pt-2">
          <Button
            asChild
            className="h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(92,73,96,.8)] transition-all hover:-translate-y-0.5 hover:bg-ds-primary-saturated focus-visible:ring-ds-primary"
          >
            <Link href="/auth/login">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("forgot-back-to-login")}
            </Link>
          </Button>

          <div className="flex items-center justify-between border-t border-ds-border-muted pt-4 text-sm text-ds-text-muted">
            <span>{t("forgot-resend-prompt")}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={cooldown > 0 || isResending}
              onClick={handleResend}
              className="font-medium text-ds-text-primary hover:text-ds-primary focus-visible:ring-ds-primary"
            >
              {isResending ? (
                <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
              ) : cooldown > 0 ? (
                t("forgot-resend-cooldown", { seconds: cooldown })
              ) : (
                t("forgot-resend-button")
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-9 space-y-5"
      onSubmit={onSubmit}
      aria-busy={isSubmitting}
      noValidate
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
        <Mail className="size-7" aria-hidden="true" />
      </div>

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
              htmlFor="forgot-email"
              className="text-sm font-medium text-ds-text-plain"
            >
              {t("forgot-email-label")}
            </FieldLabel>
            <Input
              {...field}
              id="forgot-email"
              disabled={isSubmitting}
              aria-required="true"
              dir="ltr"
              autoCapitalize="none"
              spellCheck={false}
              type="email"
              autoComplete="email"
              placeholder={t("forgot-email-placeholder")}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.error ? "forgot-email-error" : undefined
              }
              className="h-12 rounded-xl border-ds-border-muted bg-ds-elevated px-4 text-base focus-visible:ring-ds-primary"
            />
            {fieldState.error && (
              <FieldError id="forgot-email-error">
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      <Button
        type="submit"
        disabled={isSubmitting || cooldown > 0}
        className="h-12 w-full rounded-xl bg-ds-primary text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(92,73,96,.8)] transition-all hover:-translate-y-0.5 hover:bg-ds-primary-saturated focus-visible:ring-ds-primary"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{" "}
            {t("forgot-submitting")}
          </>
        ) : cooldown > 0 ? (
          t("forgot-resend-cooldown", { seconds: cooldown })
        ) : (
          <>
            {t("forgot-submit")}{" "}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="pt-2 text-center text-sm text-ds-text-muted">
        {t("forgot-remember-password")}{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-ds-text-primary underline-offset-4 hover:underline"
        >
          {t("forgot-signin-link")}
        </Link>
      </p>
    </form>
  );
}
