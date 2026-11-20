import type { Employee, EmployeeMetricsData } from "../types/employee.types";
import type { AppRole } from "@/lib/auth/types";

export function calculateEmployeeMetrics(
  employees: Employee[],
  totalCount?: number
): EmployeeMetricsData {
  const metrics: EmployeeMetricsData = {
    total: typeof totalCount === "number" ? totalCount : employees.length,
    active: 0,
    inactive: 0,
    roleCounts: {
      SUPER_ADMIN: 0,
      ADMIN: 0,
      ORDER_MANAGER: 0,
      CUSTOMER_SUPPORT: 0,
      INVENTORY_MANAGER: 0,
      ACCOUNTANT: 0,
    },
  };

  for (const emp of employees) {
    if (emp.isActive) {
      metrics.active += 1;
    } else {
      metrics.inactive += 1;
    }

    if (emp.role in metrics.roleCounts) {
      metrics.roleCounts[emp.role] += 1;
    }
  }

  return metrics;
}

export function getRoleBadgeVariant(role: AppRole): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "SUPER_ADMIN":
      return "default";
    case "ADMIN":
      return "secondary";
    default:
      return "outline";
  }
}

export function formatEmployeeDate(dateString?: string, locale: string = "en"): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}
