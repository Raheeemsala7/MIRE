import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  EmployeesDashboard,
  EmployeesSkeleton,
  type EmployeesPaginatedResponse,
} from "@/features/employees";

interface AdminEmployeesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminEmployeesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "إدارة الموظفين والصلاحيات | إدارة ميري"
      : "Employees Management & RBAC | MIRÉ Admin",
    description: isAr
      ? "إدارة فريق العمل، وتعيين الأدوار، والتحكم في صلاحيات لوحة التحكم"
      : "Manage your team, assign roles, and control access to the dashboard.",
  };
}

async function getInitialEmployeesData(
  locale: string
): Promise<EmployeesPaginatedResponse | undefined> {
  try {
    const response = await serverApiGet<EmployeesPaginatedResponse>(
      "/employees?limit=20&sort=-createdAt"
    );
    if (response?.success && Array.isArray(response.data)) {
      return response;
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      redirect(`/${locale}/403`);
    }
    // Graceful fallback: client React Query will fetch with fresh auth
  }
  return undefined;
}

async function AdminEmployeesPageContent({
  params,
}: AdminEmployeesPageProps) {
  const { locale } = await params;
  const user = await requirePermission(PERMISSIONS.EMPLOYEES_VIEW, locale);
  const initialData = await getInitialEmployeesData(locale);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<EmployeesSkeleton />}>
        <EmployeesDashboard
          initialData={initialData}
          locale={locale}
          currentUser={user}
        />
      </Suspense>
    </main>
  );
}

export default function AdminEmployeesPage(props: Parameters<typeof AdminEmployeesPageContent>[0]) {
  return <Suspense fallback={<EmployeesSkeleton />}><AdminEmployeesPageContent {...props} /></Suspense>;
}
