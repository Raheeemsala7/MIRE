"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface AdminInventoryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminInventoryError({
  error,
  reset,
}: AdminInventoryErrorProps) {
  const t = useTranslations();

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="max-w-lg mx-auto border-destructive/30 bg-destructive/5 text-center p-6">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-lg font-semibold text-destructive">
            {t("inventory-error-title") || "Failed to Load Inventory"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {error.message ||
              t("inventory-error-desc") ||
              "An unexpected error occurred while communicating with the inventory backend service."}
          </p>
          <Button
            onClick={reset}
            variant="outline"
            size="sm"
            className="gap-2 text-xs border-border"
          >
            <RefreshCw className="size-3.5" />
            <span>{t("inventory-btn-retry") || "Try Again"}</span>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
