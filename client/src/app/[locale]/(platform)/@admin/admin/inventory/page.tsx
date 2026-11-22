import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  InventoryDashboard,
  InventorySkeleton,
  calculateOverviewStats,
  type LowStockPaginatedResponse,
  type InventoryMovementsPaginatedResponse,
  type LowStockItem,
} from "@/features/inventory";

interface AdminInventoryPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AdminInventoryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة المخزون | لوحة تحكم ميري"
      : "Inventory Management | MIRÉ Admin",
    description: isAr
      ? "مراقبة مستويات المخزون، مراجعة حركات المخزون، وإجراء تسويات المخزون اليدوية."
      : "Monitor stock levels, review inventory movements, and manage manual stock adjustments.",
  };
}

async function getInitialLowStock(
  locale: string
): Promise<LowStockPaginatedResponse | undefined> {
  try {
    const response = await serverApiGet<LowStockPaginatedResponse>(
      "/inventory/low-stock?page=1&limit=20&paginated=true"
    );
    if (response?.success && Array.isArray(response.data)) {
      return response;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
  }
  return undefined;
}

async function getInitialMovements(
  locale: string,
  search?: { [key: string]: string | string[] | undefined }
): Promise<InventoryMovementsPaginatedResponse | undefined> {
  try {
    const page = typeof search?.page === "string" ? search.page : "1";
    const limit = typeof search?.limit === "string" ? search.limit : "20";
    const type = typeof search?.type === "string" && search.type !== "ALL" ? search.type : "";
    const variantSku = typeof search?.sku === "string" ? search.sku : "";
    const sortBy = typeof search?.sortBy === "string" ? search.sortBy : "createdAt:desc";

    const query = new URLSearchParams();
    query.set("page", page);
    query.set("limit", limit);
    if (type) query.set("type", type);
    if (variantSku) query.set("variantSku", variantSku);
    if (sortBy) query.set("sortBy", sortBy);

    const response = await serverApiGet<InventoryMovementsPaginatedResponse>(
      `/inventory/movements?${query.toString()}` as `/${string}`
    );
    if (response?.success && Array.isArray(response.data)) {
      return response;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
  }
  return undefined;
}

async function getAllLowStockItems(): Promise<LowStockItem[]> {
  try {
    const lowStockRes = await serverApiGet<{
      success: boolean;
      data: LowStockItem[] | { items: LowStockItem[] };
    }>("/inventory/low-stock");

    return Array.isArray(lowStockRes?.data)
      ? lowStockRes.data
      : Array.isArray((lowStockRes?.data as { items: LowStockItem[] })?.items)
      ? (lowStockRes.data as { items: LowStockItem[] }).items
      : [];
  } catch {
    return [];
  }
}

async function AdminInventoryPageContent({
  params,
  searchParams,
}: AdminInventoryPageProps) {
  const { locale } = await params;
  const search = searchParams ? await searchParams : undefined;
  const user = await requirePermission(PERMISSIONS.INVENTORY_VIEW, locale);

  const [initialLowStock, initialMovements, allLowStockItems] =
    await Promise.all([
      getInitialLowStock(locale),
      getInitialMovements(locale, search),
      getAllLowStockItems(),
    ]);

  const overviewStats = calculateOverviewStats(
    allLowStockItems,
    initialMovements?.meta?.total ?? 0
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryDashboard
          initialLowStock={initialLowStock}
          initialMovements={initialMovements}
          overviewStats={overviewStats}
          currentUser={user}
          locale={locale}
        />
      </Suspense>
    </main>
  );
}

export default function AdminInventoryPage(props: AdminInventoryPageProps) {
  return <AdminInventoryPageContent {...props} />;
}
