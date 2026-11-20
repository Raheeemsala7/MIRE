import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server-authorization";
import { serverApiGet } from "@/lib/auth/session";
import { BackendApiError } from "@/lib/auth/backend-client";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  EmployeeDetails,
  EmployeeDetailsSkeleton,
  type SingleEmployeeResponse,
  type Employee,
} from "@/features/employees";

export const instant = false;

interface EmployeeDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: EmployeeDetailsPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  try {
    const res = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
    );
    if (res?.data) {
      return {
        title: isAr
          ? `${res.data.name} | إدارة الموظفين | ميري`
          : `${res.data.name} | Staff Profile | MIRÉ Admin`,
        description: res.data.email,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: isAr ? "الملف التعريفي للموظف | ميري" : "Employee Profile | MIRÉ Admin",
  };
}

async function getEmployee(id: string, locale: string): Promise<Employee> {
  try {
    const response = await serverApiGet<SingleEmployeeResponse>(
      `/employees/${encodeURIComponent(id)}` as `/${string}`
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

export default async function EmployeeDetailsPage({
  params,
}: EmployeeDetailsPageProps) {
  const { locale, id } = await params;
  const user = await requirePermission(PERMISSIONS.EMPLOYEES_VIEW, locale);

  const employee = await getEmployee(id, locale);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<EmployeeDetailsSkeleton />}>
        <EmployeeDetails
          employee={employee}
          currentUser={user}
          locale={locale}
        />
      </Suspense>
    </main>
  );
}
