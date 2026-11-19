import Link from "next/link";
import { Link as LocalizedLink } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthLocale } from "@/features/auth/lib/locale";
import { currentUser, destination } from "@/lib/auth/session";

export const instant = false;

export default async function ForbiddenPage() {
  const locale = await getAuthLocale();
  const t = await getTranslations({ locale });
  const user = await currentUser();
  const target = user ? destination(user.role, locale) : `/${locale}/auth/login`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <LocalizedLink href="/" locale={locale} className="font-serif text-3xl tracking-[.16em] text-ds-text-primary">MIRÉ</LocalizedLink>
      <h1 className="mt-12 font-serif text-5xl">{t("auth-forbidden-title")}</h1>
      <p className="mt-5 max-w-md text-ds-text-muted">{t("auth-forbidden-description")}</p>
      {target.endsWith("/403") ? (
        <LocalizedLink href="/" locale={locale} className="mt-9 rounded-full bg-ds-primary px-7 py-3 text-sm font-semibold text-white">{t("login-back")}</LocalizedLink>
      ) : (
        <Link href={target} className="mt-9 rounded-full bg-ds-primary px-7 py-3 text-sm font-semibold text-white">{t(user ? "auth-forbidden-home" : "login-submit")}</Link>
      )}
    </main>
  );
}
