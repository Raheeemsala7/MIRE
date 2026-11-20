import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { CustomerReturnsHub } from "@/features/returns";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

interface CustomerReturnsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CustomerReturnsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "المرتجعات والاستبدال | ميري"
      : "Returns & Exchanges | MIRÉ",
    description: isAr
      ? "سياسة وطلبات الإرجاع والاستبدال لمتجر ميري"
      : "MIRÉ customer returns, exchanges, and return request submission.",
  };
}

async function CustomerReturnsPageContent({
  params,
}: CustomerReturnsPageProps) {
  const { locale } = await params;
  const user = await requireRole(["CUSTOMER", "ADMIN", "SUPER_ADMIN"], locale);

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <CustomerReturnsHub locale={locale} userName={user.name} />
    </main>
  );
}

export default function CustomerReturnsPage(
  props: Parameters<typeof CustomerReturnsPageContent>[0]
) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <CustomerReturnsPageContent {...props} />
    </Suspense>
  );
}
