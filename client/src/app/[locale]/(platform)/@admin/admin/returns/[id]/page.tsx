import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  ReturnDetails,
  ReturnDetailsSkeleton,
  type SingleReturnResponse,
  type ReturnDoc,
} from "@/features/returns";

interface AdminReturnDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminReturnDetailsPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    await requirePermission(PERMISSIONS.RETURNS_VIEW, locale);
    const res = await serverApiGet<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}` as `/${string}`
    );
    if (res?.data) {
      return {
        title: isAr
          ? `طلب إرجاع ${res.data.returnNumber} | إدارة ميري`
          : `Return ${res.data.returnNumber} | MIRÉ Admin`,
        description: isAr
          ? `تفاصيل وإجراءات طلب الإرجاع ${res.data.returnNumber}`
          : `Details and lifecycle management for return ${res.data.returnNumber}`,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr
      ? "تفاصيل طلب الإرجاع | إدارة ميري"
      : "Return Details | MIRÉ Admin",
  };
}

async function getReturnDetails(
  id: string,
  locale: string
): Promise<ReturnDoc> {
  try {
    const response = await serverApiGet<SingleReturnResponse>(
      `/returns/${encodeURIComponent(id)}` as `/${string}`
    );
    if (response?.success && response.data) {
      return response.data;
    }
    notFound();
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) {
        redirect(`/${locale}/403`);
      }
      if (error.status === 404 || error.status === 400) {
        notFound();
      }
    }
    throw error;
  }
}

async function AdminReturnDetailsPageContent({
  params,
}: AdminReturnDetailsPageProps) {
  const { locale, id } = await params;
  const user = await requirePermission(PERMISSIONS.RETURNS_VIEW, locale);
  const returnDoc = await getReturnDetails(id, locale);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<ReturnDetailsSkeleton />}>
        <ReturnDetails
          initialReturn={returnDoc}
          locale={locale}
          currentUser={user}
        />
      </Suspense>
    </main>
  );
}

export default function AdminReturnDetailsPage(
  props: Parameters<typeof AdminReturnDetailsPageContent>[0]
) {
  return (
    <Suspense fallback={<ReturnDetailsSkeleton />}>
      <AdminReturnDetailsPageContent {...props} />
    </Suspense>
  );
}
