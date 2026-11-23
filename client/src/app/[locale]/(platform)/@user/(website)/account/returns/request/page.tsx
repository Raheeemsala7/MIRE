import { Suspense } from "react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { requireRole, serverApiGet } from "@/lib/auth/session";
import { ArrowLeft, ShieldAlert, Package } from "lucide-react";
import { ReturnRequestForm } from "@/features/returns";
import { canCustomerRequestReturn } from "@/features/returns/utils/return-eligibility.util";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

interface ReturnRequestPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: ReturnRequestPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "طلب إرجاع جديد | ميري" : "Request a Return | MIRÉ",
    description: isAr
      ? "تقديم طلب إرجاع للمنتجات المؤهلة وفق سياسة المتجر"
      : "Submit a return request for eligible items.",
  };
}

async function ReturnRequestPageContent({
  params,
  searchParams,
}: ReturnRequestPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isAr = locale === "ar";
  const user = await requireRole(["CUSTOMER", "ADMIN", "SUPER_ADMIN"], locale);

  const targetedOrderId =
    typeof resolvedSearchParams?.orderId === "string"
      ? resolvedSearchParams.orderId
      : undefined;

  // Direct URL Protection: If targeting a specific order, verify eligibility on the server
  if (targetedOrderId) {
    let targetedOrder: {
      _id?: string;
      orderNumber?: string;
      status: string;
      customer?: string | { _id: string; id?: string } | null;
      customerId?: string | null;
    } | null = null;

    try {
      const orderRes = await serverApiGet<{
        success: boolean;
        data: {
          _id?: string;
          orderNumber?: string;
          status: string;
          customer?: string | { _id: string; id?: string } | null;
          customerId?: string | null;
        };
      }>(`/orders/${encodeURIComponent(targetedOrderId)}` as `/${string}`);
      targetedOrder = orderRes?.data || (orderRes as unknown as typeof targetedOrder);
    } catch {
      targetedOrder = null;
    }

    const eligibility = canCustomerRequestReturn(targetedOrder, user.id);

    // If ineligible (especially if status === DELIVERED), block form rendering
    if (!eligibility.eligible) {
      return (
        <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-destructive/30 bg-card p-8 sm:p-12 text-center shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-7" />
            </div>

            <h1 className="mt-5 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isAr
                ? "طلب الاسترجاع غير متاح لهذا الطلب."
                : "Return requests are unavailable for this order."}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
              {targetedOrder?.status === "DELIVERED"
                ? isAr
                  ? "وفقاً للسياسة المحدثة للمتجر، لا يمكن تقديم طلب إرجاع لهذا الطلب بعد أن أصبحت حالته مستلم (DELIVERED)."
                  : "Under current store policy, return requests cannot be submitted for this order once its status has become DELIVERED."
                : isAr
                ? eligibility.messageAr || "حالة هذا الطلب لا تتيح إنشاء طلب إرجاع حالياً."
                : eligibility.messageEn || "Return requests are currently unavailable for this order status."}
            </p>

            {targetedOrder?.orderNumber && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border/60">
                <Package className="size-3.5" />
                <span>#{targetedOrder.orderNumber}</span>
                <span>·</span>
                <span className="font-semibold">{targetedOrder.status}</span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="size-3.5 rtl:rotate-180" />
                <span>{isAr ? "العودة لتفاصيل الطلبات" : "Back to Order Details"}</span>
              </Link>
              <Link
                href="/account/returns"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-6 py-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted"
              >
                <span>{isAr ? "قسم المرتجعات" : "Returns Hub"}</span>
              </Link>
            </div>
          </div>
        </main>
      );
    }
  }

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
              ? "اختاري الطلب المؤهل وحددي القطع المراد إرجاعها لترتيب استلام المندوب."
              : "Choose an eligible order and select items you wish to return for courier collection."}
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
