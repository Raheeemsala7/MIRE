import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import { getAdminOrdersApi, getAdminOrderByIdApi } from "@/features/admin/orders/apis/orders.api";
import { AdminReturnCreateForm } from "@/features/returns";
import AdminNewReturnLoading from "./loading";
import type { OrderDoc } from "@/features/admin/orders/types/order-admin.types";

interface AdminNewReturnPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminNewReturnPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إنشاء طلب إرجاع جديد | لوحة تحكم ميري"
      : "Create Return Request | MIRÉ Admin",
    description: isAr
      ? "إنشاء طلب إرجاع نيابة عن العميل للطلبات المستلمة المؤهلة"
      : "Submit a return request on behalf of a customer for an eligible order.",
  };
}

async function AdminNewReturnPageContent({
  params,
  searchParams,
}: AdminNewReturnPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requirePermission(PERMISSIONS.RETURNS_CREATE, locale);

  const preselectedOrderId =
    typeof resolvedSearchParams?.orderId === "string"
      ? resolvedSearchParams.orderId
      : undefined;

  let initialOrders: OrderDoc[] = [];

  try {
    // Fetch delivered orders since backend accepts returns only for DELIVERED orders
    const ordersRes = await getAdminOrdersApi("status=DELIVERED&limit=50&sort=-createdAt");
    initialOrders = ordersRes.orders;

    // If preselected order exists and isn't in recent list, fetch and prepend it
    if (preselectedOrderId && !initialOrders.some((o) => o._id === preselectedOrderId)) {
      const singleOrder = await getAdminOrderByIdApi(preselectedOrderId);
      if (singleOrder) {
        initialOrders.unshift(singleOrder);
      }
    }
  } catch {
    initialOrders = [];
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminReturnCreateForm
        locale={locale}
        initialOrders={initialOrders}
        userRole={user.role}
        preselectedOrderId={preselectedOrderId}
      />
    </main>
  );
}

export default function AdminNewReturnPage(
  props: Parameters<typeof AdminNewReturnPageContent>[0]
) {
  return (
    <Suspense fallback={<AdminNewReturnLoading />}>
      <AdminNewReturnPageContent {...props} />
    </Suspense>
  );
}
