"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import type { AnalyticsFilter, AnalyticsRange } from "../types/analytics.types";

interface AnalyticsFiltersProps {
  filter: AnalyticsFilter;
  onChange: (filter: AnalyticsFilter) => void;
  isFetching?: boolean;
  onRefresh?: () => void;
}

export function AnalyticsFilters({
  filter,
  onChange,
  isFetching,
  onRefresh,
}: AnalyticsFiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState(filter.startDate ?? "");
  const [customEnd, setCustomEnd] = useState(filter.endDate ?? "");

  const presets: { label: string; value: AnalyticsRange }[] = [
    { label: t("analytics-range-today"), value: "today" },
    { label: t("analytics-range-yesterday"), value: "yesterday" },
    { label: t("analytics-range-7d"), value: "7d" },
    { label: t("analytics-range-30d"), value: "30d" },
  ];

  const handleApplyCustom = () => {
    if (!customStart) return;
    onChange({
      range: "custom",
      startDate: customStart,
      endDate: customEnd || customStart,
    });
    setCustomOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-5">
      {/* Preset range pills */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1">
        {presets.map((preset) => {
          const isActive = filter.range === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange({ range: preset.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        {/* Custom date range popover */}
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter.range === "custom"
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              }`}
            >
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              <span>
                {filter.range === "custom" && filter.startDate
                  ? `${filter.startDate} → ${filter.endDate || ""}`
                  : t("analytics-range-custom")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3 p-4" align="end">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                {t("analytics-range-custom")}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {t("analytics-custom-desc") || (isAr ? "اختر تاريخ البدء وتاريخ الانتهاء للمؤشرات." : "Choose start and end dates for analytics.")}
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <label htmlFor="custom-start-date" className="block text-[11px] font-medium text-muted-foreground">
                  {t("analytics-custom-start") || (isAr ? "تاريخ البدء" : "Start Date")}
                </label>
                <Input
                  id="custom-start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label htmlFor="custom-end-date" className="block text-[11px] font-medium text-muted-foreground">
                  {t("analytics-custom-end") || (isAr ? "تاريخ الانتهاء" : "End Date")}
                </label>
                <Input
                  id="custom-end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCustomOpen(false)}
              >
                {t("analytics-custom-cancel") || (isAr ? "إلغاء" : "Cancel")}
              </Button>
              <Button
                size="sm"
                className="h-7 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
                onClick={handleApplyCustom}
              >
                {t("analytics-custom-apply") || (isAr ? "تطبيق" : "Apply")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Action utilities */}
      {onRefresh && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-8 gap-1.5 rounded-lg border-border/70 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <RefreshCw
            className={`size-3.5 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />
          <span>{t("analytics-refresh")}</span>
        </Button>
      )}
    </div>
  );
}
