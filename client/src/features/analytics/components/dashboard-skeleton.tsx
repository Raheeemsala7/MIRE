import { Skeleton } from "@/shared/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      {/* KPI Row Skeleton (4 cols) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3.5 w-36" />
          </div>
        ))}
      </div>

      {/* Operational Status Bar Skeleton */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Main Row: Overview Chart (7 cols) + Recent Sales (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>

      {/* Secondary Row: 3 Breakdown Charts (4 cols each) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>

      {/* Tertiary Row: Top Products (7 cols) + Inventory Alerts (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
