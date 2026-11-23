import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { User, Mail, Shield, Phone, RotateCcw, ArrowRight, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LogoutButton } from "@/features/auth/components/login/logout-button";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "حسابي الشخصي | ميري" : "My Account | MIRÉ",
  };
}

async function AccountPageContent({ params }: AccountPageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const user = await requireRole(["CUSTOMER", "ADMIN", "SUPER_ADMIN"], locale);

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-6 py-16 sm:px-10">
      <div className="flex items-center justify-between border-b border-ds-border-muted pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-ds-subtle text-ds-primary shadow-sm ring-1 ring-ds-border-muted">
            <User className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-ds-text-plain sm:text-4xl">
              {isAr ? "الملف الشخصي" : "Personal Account"}
            </h1>
            <p className="mt-1 text-sm text-ds-text-muted">
              {isAr ? "معلومات الحساب وإعدادات الأمان" : "Account details and security preferences"}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10 rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-ds-border-subtle bg-ds-plain p-4">
            <User className="size-5 text-ds-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-ds-text-muted">{isAr ? "الاسم" : "Name"}</p>
              <p className="text-base font-medium text-ds-text-plain">{user.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ds-border-subtle bg-ds-plain p-4">
            <Mail className="size-5 text-ds-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-ds-text-muted">{isAr ? "البريد الإلكتروني" : "Email"}</p>
              <p className="text-base font-medium text-ds-text-plain" dir="ltr">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ds-border-subtle bg-ds-plain p-4">
            <Shield className="size-5 text-ds-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-ds-text-muted">{isAr ? "نوع الحساب" : "Role"}</p>
              <p className="text-base font-medium text-ds-text-plain">
                {user.role.replaceAll("_", " ").toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ds-border-subtle bg-ds-plain p-4">
            <Phone className="size-5 text-ds-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-ds-text-muted">{isAr ? "رقم الهاتف" : "Phone"}</p>
              <p className="text-base font-medium text-ds-text-plain" dir="ltr">—</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-ds-border-subtle bg-ds-plain p-5 sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-ds-primary/10 text-ds-primary shrink-0 mt-0.5">
                <Package className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-medium text-ds-text-plain">
                  {isAr ? "طلباتي ومتابعة الشحن" : "My Orders & Tracking"}
                </p>
                <p className="text-xs text-ds-text-muted mt-0.5">
                  {isAr
                    ? "عرض سجل طلباتكِ ومتابعة مراحل التوصيل والشحن خطوة بخطوة"
                    : "View your order history and track live delivery progress step-by-step"}
                </p>
              </div>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ds-primary px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ds-primary-saturated transition-colors shrink-0"
            >
              <span>{isAr ? "عرض الطلبات" : "View Orders"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-ds-border-subtle bg-ds-plain p-5 sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <RotateCcw className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-medium text-ds-text-plain">
                  {isAr ? "المرتجعات والاستبدال" : "Returns & Exchanges"}
                </p>
                <p className="text-xs text-ds-text-muted mt-0.5">
                  {isAr
                    ? "متابعة طلبات الإرجاع وإدارة الاستبدال وفق سياسة المتجر"
                    : "Track return requests and manage product exchanges according to store policy"}
                </p>
              </div>
            </div>
            <Link
              href="/account/returns"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors shrink-0"
            >
              <span>{isAr ? "قسم المرتجعات" : "Returns Hub"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage(props: Parameters<typeof AccountPageContent>[0]) {
  return <Suspense fallback={<AuthSkeleton />}><AccountPageContent {...props} /></Suspense>;
}
