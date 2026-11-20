import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

export function ReturnsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/60">
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReturnsTableSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
        <Skeleton className="h-10 w-full sm:w-72" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
      <div className="flex items-center justify-between pt-6">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ReturnsDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <ReturnsOverviewSkeleton />
      <ReturnsTableSkeleton />
    </div>
  );
}

export function ReturnDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
