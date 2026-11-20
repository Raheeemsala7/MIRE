import { Suspense } from "react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth/session";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { RotateCcw, ArrowLeft, ShieldAlert } from "lucide-react";

interface CustomerReturnDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: CustomerReturnDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "متابعة المرتجع | ميري"
      : "Return Status | MIRÉ",
  };
}

async function CustomerReturnDetailPageContent({
  params,
}: CustomerReturnDetailPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";
  await requireRole(["CUSTOMER", "ADMIN", "SUPER_ADMIN"], locale);

  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 sm:p-10 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isAr ? "متابعة حالة طلب الإرجاع" : "Return Request Tracking"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground">
          {isAr
            ? "يتم تتبع حالة الإرجاع والفحص الفني داخلياً من قبل فريق العمليات. سيتواصل معكِ المندوب أو ممثل خدمة العملاء فور تحديث حالة الشحنة."
            : "Return progress and technical inspection are currently coordinated directly with our operations team. You will be contacted by our courier partner or support representative as your return advances."}
        </p>

        <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground text-start space-y-1">
          <p className="font-semibold text-foreground">
            {isAr ? "معلومات هامة:" : "Important Note:"}
          </p>
          <p>
            {isAr
              ? "لحماية الخصوصية، تتطلب منصة ميري قنوات اتصال آمنة ومباشرة للتحقق من المرتجعات. للاستفسار عن هذا الطلب بالرقم المرجعي، يرجى التواصل مع خدمة العملاء."
              : "For security and privacy, returns are verified and tracked with staff confirmation. To inquire about this reference, please reach out to customer support with your order number."}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account/returns"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-6 py-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" />
            <span>{isAr ? "العودة لقسم المرتجعات" : "Back to Returns Hub"}</span>
          </Link>
          <Link
            href="/account/returns/request"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <RotateCcw className="size-3.5" />
            <span>{isAr ? "تقديم طلب إرجاع جديد" : "Request New Return"}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CustomerReturnDetailPage(
  props: Parameters<typeof CustomerReturnDetailPageContent>[0]
) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <CustomerReturnDetailPageContent {...props} />
    </Suspense>
  );
}
