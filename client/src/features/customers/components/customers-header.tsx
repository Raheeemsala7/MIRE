"use client";

import { useTranslations } from "next-intl";
import { Users, RefreshCw } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

interface CustomersHeaderProps {
  totalCount?: number;
  isFetching?: boolean;
  onRefresh?: () => void;
}

export function CustomersHeader({
  totalCount,
  isFetching,
  onRefresh,
}: CustomersHeaderProps) {
  // Translation
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            {t("customers-title") || "Customers"}
          </h1>
          {totalCount !== undefined && (
            <Badge variant="secondary" className="text-xs font-sans font-medium">
              <Users className="me-1 size-3" />
              {totalCount}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("customers-description") ||
            "Manage customer information, organize profiles, and review customer activity."}
        </p>
      </div>

      {onRefresh && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>{t("customers-action-refresh") || "Refresh"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
