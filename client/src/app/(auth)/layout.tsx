import "../globals.css";
import { authAmiri, authTajawal, platformGeist, platformPlayfair } from "@/shared/lib/platform-fonts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getAuthLocale } from "@/features/auth/lib/locale";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAuthLocale();
  const messages = await getMessages({ locale });
  const authMessages = Object.fromEntries(Object.entries(messages).filter(([key]) => key.startsWith("login-") || key.startsWith("register-password-")));

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${authTajawal.variable} ${authAmiri.variable} ${platformGeist.variable} ${platformPlayfair.variable} h-full antialiased`}>
      <body className="min-h-full bg-ds-plain text-ds-text-plain">
        <NextIntlClientProvider locale={locale} messages={authMessages} timeZone="Africa/Cairo">
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
