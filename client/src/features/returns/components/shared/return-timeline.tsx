"use client";

import React from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import type { StatusHistoryEntry } from "../../types/return.types";
import { ReturnStatusBadge } from "./return-status-badge";
import { formatDate } from "../../utils/return.util";

interface ReturnTimelineProps {
  history: StatusHistoryEntry[];
  locale?: string;
}

export const ReturnTimeline = React.memo(function ReturnTimeline({
  history,
  locale = "en",
}: ReturnTimelineProps) {
  const isAr = locale === "ar";

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <Clock className="size-8 stroke-1 text-muted-foreground/60 mb-2" />
        <p className="text-sm">
          {isAr ? "لا توجد سجلات نشاط مسجلة حتى الآن." : "No timeline events recorded yet."}
        </p>
      </div>
    );
  }

  // Display chronologically descending (latest first)
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:top-2 before:bottom-2 before:start-3.5 before:w-0.5 before:bg-border/60">
      {sorted.map((item, index) => {
        const changer =
          typeof item.changedBy === "object" && item.changedBy !== null
            ? item.changedBy.name
            : isAr
              ? "النظام / المشرف"
              : "System / Staff";

        return (
          <div key={item._id || index} className="relative flex items-start gap-4 ps-1">
            <div className="relative z-10 flex size-7 items-center justify-center rounded-full border border-border bg-card text-primary shadow-xs">
              {index === 0 ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="size-2 rounded-full bg-muted-foreground/50" />
              )}
            </div>

            <div className="flex-1 rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ReturnStatusBadge status={item.status} locale={locale} />
                  <span className="text-xs text-muted-foreground">
                    {isAr ? `بواسطة: ${changer}` : `by ${changer}`}
                  </span>
                </div>
                <time className="text-xs text-muted-foreground" dir="ltr">
                  {formatDate(item.timestamp, locale)}
                </time>
              </div>

              {item.notes && (
                <p className="mt-2 text-sm text-foreground/90 bg-background/60 rounded-md p-2 border border-border/40">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
