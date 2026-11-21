import { Users, UserCheck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { EmployeeMetricsData } from "../types/employee.types";

interface EmployeesMetricsProps {
  metrics: EmployeeMetricsData;
}

export function EmployeesMetrics({ metrics }: EmployeesMetricsProps) {
  const t = useTranslations();

  const items = [
    {
      label: t("employees-metric-total") || "Total Staff",
      value: metrics.total,
      description: t("employees-metric-total-desc") || "Registered employee profiles",
      icon: Users,
      iconColor: "text-primary",
      bgBadge: "bg-primary/10 text-primary",
    },
    {
      label: t("employees-metric-active") || "Active Accounts",
      value: metrics.active,
      description: t("employees-metric-active-desc") || "Staff with operational access",
      icon: UserCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("employees-metric-inactive") || "Inactive Accounts",
      value: metrics.inactive,
      description: t("employees-metric-inactive-desc") || "Suspended or pending staff",
      icon: UserX,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgBadge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="relative overflow-hidden border border-border/60 bg-card/60 transition-shadow hover:shadow-xs"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                <span className={`inline-flex rounded-lg p-2 ${item.bgBadge}`}>
                  <Icon className={`size-4 ${item.iconColor}`} />
                </span>
              </div>
              <div className="mt-3">
                <span className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
