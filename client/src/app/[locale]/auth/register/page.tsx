import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RegisterForm } from "@/features/auth/components/register/register-form";
import { Link } from "@/i18n/navigation";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("register-meta-title"), description: t("register-meta-description") };
}

export default async function RegisterPage({ params }: RegisterPageProps): Promise<ReactNode> {
  // Translation
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex min-h-svh flex-col bg-ds-plain">
      <header className="border-b border-ds-border-subtle">
        <nav aria-label={t("register-navigation")} className="mx-auto grid h-20 max-w-7xl grid-cols-3 items-center px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex min-h-11 w-fit items-center gap-2 rounded-sm text-xs text-ds-text-muted transition-colors hover:text-ds-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary sm:text-sm">
            <ArrowLeft className="size-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
            <span>{t("register-back")}</span>
          </Link>
          <Link href="/" aria-label={t("register-brand-home")} className="justify-self-center rounded-sm font-brand-serif text-3xl font-medium tracking-wider focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary">{t("common.brand")}</Link>
          <Link href="/auth/register" locale={locale === "ar" ? "en" : "ar"} lang={locale === "ar" ? "en" : "ar"} hrefLang={locale === "ar" ? "en" : "ar"} className="flex min-h-11 min-w-11 items-center justify-center justify-self-end rounded-full px-3 text-sm text-ds-text-muted transition-colors hover:bg-ds-subtle hover:text-ds-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary">{t("common.langToggle")}</Link>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-10 xl:gap-24">
        <aside aria-label={t("register-collection-label")} className="hidden overflow-hidden rounded-2xl bg-ds-subtle lg:block">
          <div className="relative aspect-square overflow-hidden bg-ds-secondary-faint xl:aspect-5/4">
            <Image src="/products/skirt/sky-blue.png" alt={t("register-image-alt")} fill sizes="(min-width: 1280px) 500px, 45vw" preload className="object-cover object-center" />
          </div>
          <div className="px-8 py-8 xl:px-10">
            <h2 className="max-w-sm text-4xl font-normal leading-tight text-ds-text-primary">{t("register-story-title")}</h2>
            <div className="mt-5 flex items-end justify-between gap-6">
              <p className="max-w-64 text-sm leading-6 text-ds-text-muted">{t("register-story-description")}</p>
              <Link href="/products" aria-label={t("register-explore")} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ds-border-muted text-ds-text-primary transition-colors hover:border-ds-primary hover:bg-ds-secondary-faint focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ds-primary">
                <ArrowUpRight className="size-5 rtl:-rotate-90" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>

        <section aria-label={t("register-title")} className="mx-auto w-full max-w-md">
         <RegisterForm />
        </section>
      </main>

      <footer className="px-6 pb-6 text-center text-xs leading-5 text-ds-text-muted">
        {t("register-footer")}
      </footer>
    </div>
  );
}
