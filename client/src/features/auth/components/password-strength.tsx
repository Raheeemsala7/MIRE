"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, Dot } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export function PasswordStrength({ password = "", className }: PasswordStrengthProps) {
  const t = useTranslations();

  const checks = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const score = useMemo(() => {
    if (!password) return 0;
    return (
      (checks.length ? 1 : 0) +
      (checks.uppercase ? 1 : 0) +
      (checks.number ? 1 : 0) +
      (checks.symbol ? 1 : 0)
    );
  }, [password, checks]);

  const { level, label, activeBars, barColor } = useMemo(() => {
    if (score <= 1) {
      return {
        level: "weak",
        label: t("reset-strength-weak"),
        activeBars: password.length > 0 ? 1 : 0,
        barColor: "bg-amber-600 dark:bg-amber-500",
      };
    }
    if (score < 4) {
      return {
        level: "fair",
        label: t("reset-strength-fair"),
        activeBars: 2,
        barColor: "bg-amber-500",
      };
    }
    return {
      level: "strong",
      label: t("reset-strength-strong"),
      activeBars: 3,
      barColor: "bg-emerald-600 dark:bg-emerald-500",
    };
  }, [score, password.length, t]);

  const requirements = [
    { key: "length", label: t("reset-req-length"), met: checks.length },
    { key: "uppercase", label: t("reset-req-uppercase"), met: checks.uppercase },
    { key: "number", label: t("reset-req-number"), met: checks.number },
    { key: "symbol", label: t("reset-req-symbol"), met: checks.symbol },
  ];

  return (
    <div className={cn("space-y-3 pt-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ds-text-muted">{t("reset-strength-label")}</span>
        <span
          className={cn(
            "font-medium transition-colors",
            level === "weak" && password.length > 0 && "text-amber-600 dark:text-amber-500",
            level === "fair" && "text-amber-600 dark:text-amber-500",
            level === "strong" && "text-emerald-600 dark:text-emerald-500",
            password.length === 0 && "text-ds-text-soft",
          )}
          role="status"
          aria-live="polite"
        >
          {password.length > 0 ? label : "—"}
        </span>
      </div>

      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < activeBars ? barColor : "bg-ds-border-muted",
            )}
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-1.5 pt-1 text-xs sm:grid-cols-2">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              req.met ? "text-emerald-700 dark:text-emerald-400" : "text-ds-text-soft",
            )}
          >
            {req.met ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Dot className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
