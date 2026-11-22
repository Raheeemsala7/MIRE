import React from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CouponsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 3 Metric Cards Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border/60 bg-card/60 p-6 flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded-md bg-muted/60" />
              <Skeleton className="h-8 w-16 rounded-lg bg-muted/80" />
            </div>
            <Skeleton className="size-12 rounded-2xl bg-muted/50" />
          </div>
        ))}
      </div>

      {/* Control Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-11 w-full max-w-md rounded-2xl bg-muted/50" />
          <Skeleton className="h-11 w-44 rounded-2xl bg-muted/40" />
        </div>
        <Skeleton className="h-11 w-36 rounded-2xl bg-primary/20" />
      </div>

      {/* Coupons Voucher Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="relative rounded-3xl border border-border/60 bg-card/70 p-6 space-y-5 overflow-hidden"
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28 rounded-full bg-primary/15" />
              <Skeleton className="h-5 w-16 rounded-full bg-emerald-500/15" />
            </div>

            {/* Code Box */}
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3.5">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16 rounded bg-muted/50" />
                <Skeleton className="h-7 w-32 rounded-lg bg-muted/80" />
              </div>
              <Skeleton className="size-8 rounded-xl bg-muted/60" />
            </div>

            {/* Meta details */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Skeleton className="h-4 w-24 rounded bg-muted/40" />
              <Skeleton className="h-4 w-24 rounded bg-muted/40" />
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <Skeleton className="h-4 w-20 rounded bg-muted/40" />
              <Skeleton className="size-8 rounded-xl bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
