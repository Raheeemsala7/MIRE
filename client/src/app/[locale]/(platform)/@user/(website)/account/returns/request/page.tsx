import { Suspense } from "react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";
import { ArrowLeft } from "lucide-react";
import { ReturnRequestForm } from "@/features/returns";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

interface ReturnRequestPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ReturnRequestPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "طلب إرجاع جديد | ميري" : "Request a Return | MIRÉ",
    description: isAr
      ? "تقديم طلب إرجاع للمنتجات المستلمة وفق سياسة الإرجاع"
      : "Submit a return request for eligible delivered items.",
  };
}

async function ReturnRequestPageContent({ params }: ReturnRequestPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";
  await requireRole(["CUSTOMER", "ADMIN", "SUPER_ADMIN"], locale);

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-6 mb-8">
        <Link
          href="/account/returns"
          className="flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground shadow-2xs hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isAr ? "طلب إرجاع منتج" : "Request a Return"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isAr
              ? "اختاري الطلب المستلم وحددي القطع المراد إرجاعها لترتيب استلام المندوب."
              : "Choose an eligible delivered order and select items you wish to return for courier collection."}
          </p>
        </div>
      </div>

      <ReturnRequestForm locale={locale} />
    </main>
  );
}

export default function ReturnRequestPage(
  props: Parameters<typeof ReturnRequestPageContent>[0]
) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ReturnRequestPageContent {...props} />
    </Suspense>
  );
}
