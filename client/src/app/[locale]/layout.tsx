import type { Metadata } from "next";
import { Tajawal, Playfair_Display, Geist, Amiri } from "next/font/google";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale, getMessages } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import { Providers } from "@/src/shared/context/providers";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: LocaleLayoutProps["params"];
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  return {
    title: isAr
      ? "ميري | أزياء نسائية معاصرة محتشمة — MIRÉ"
      : "MIRÉ | Contemporary Modest Womenswear",
    description: isAr
      ? "الزهور فقط ترتدي ميري. ببساطة صُنعت بإتقان بأقمشة طبيعية وقصات مفعمة بالثقة والهدوء."
      : "Only flowers wear MIRÉ. Simply, well made modest womenswear in natural fabrics.",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${tajawal.variable} ${amiri.variable} ${playfair.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ds-plain text-ds-text-plain selection:bg-ds-primary selection:text-white">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
