import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent } from "@/shared/components/ui/card";

export function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["metric-total", "metric-active", "metric-spent", "metric-aov"].map((key) => (
          <Card key={key} className="border border-border/60 bg-card/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card className="border border-border/60 bg-card/60">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 justify-between">
          <Skeleton className="h-9 w-full sm:w-80" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"].map((key) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 hidden md:block" />
              <Skeleton className="h-4 w-16 hidden lg:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function CustomerDetailsSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Skeleton className="h-4 w-32" />

      {/* Identity Card */}
      <Card className="border border-border/60">
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["detail-1", "detail-2", "detail-3", "detail-4"].map((key) => (
              <div key={key} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["metric-1", "metric-2", "metric-3"].map((key) => (
          <Card key={key} className="border border-border/60 bg-card/60">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Skeleton */}
      <Card className="border border-border/60">
        <div className="p-6 border-b border-border/60">
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="p-6 space-y-3">
          {["order-row-1", "order-row-2", "order-row-3", "order-row-4"].map((key) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
