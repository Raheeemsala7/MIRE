import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthLocale } from "@/features/auth/lib/locale";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { currentUser, destination } from "@/lib/auth/session";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAuthLocale();
  const t = await getTranslations({ locale });
  return { title: t("reset-meta-title") };
}

export const instant = false;

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const locale = await getAuthLocale();
  const t = await getTranslations({ locale });
  const user = await currentUser();
  if (user) redirect(destination(user.role));

  const resolvedParams = await searchParams;
  const token = resolvedParams.token ?? "";

  return (
    <main className="auth-surface grid min-h-screen bg-ds-plain lg:grid-cols-[minmax(0,1fr)_minmax(440px,48%)]">
      <section className="relative hidden overflow-hidden bg-ds-primary-saturated text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          className="absolute -right-24 -top-24 size-[32rem] rounded-full border border-white/15"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-48 -left-32 size-[42rem] rounded-full border border-white/10"
          aria-hidden="true"
        />
        <Link
          href="/"
          locale={locale}
          className="relative z-10 w-fit font-serif text-3xl tracking-[.16em] text-white"
        >
          MIRÉ
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="font-serif text-5xl leading-[1.18] tracking-tight xl:text-6xl">
            {t("reset-story-title")}
          </p>
          <p className="mt-7 max-w-md text-base leading-7 text-white/80">
            {t("reset-story-description")}
          </p>
        </div>
        <p className="relative z-10 text-xs tracking-[.18em] text-white/60">
          {t("login-story-caption")}
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            locale={locale}
            className="font-serif text-2xl tracking-[.16em] text-ds-text-primary lg:hidden"
          >
            MIRÉ
          </Link>
          <Link
            href="/login"
            locale={locale}
            className="ms-auto text-sm text-ds-text-muted underline-offset-4 hover:text-ds-text-primary hover:underline"
          >
            {t("reset-back-to-login")}
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
          <h1 className="font-serif text-4xl tracking-tight text-ds-text-plain sm:text-5xl">
            {t("reset-title")}
          </h1>
          <p className="mt-4 text-base leading-7 text-ds-text-muted">
            {t("reset-description")}
          </p>
          <ResetPasswordForm token={token} />
        </div>
        <p className="text-center text-xs text-ds-text-soft">MIRÉ</p>
      </section>
    </main>
  );
}
