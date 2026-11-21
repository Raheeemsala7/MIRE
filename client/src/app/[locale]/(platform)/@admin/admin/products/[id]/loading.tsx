import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card } from "@/shared/components/ui/card";

export default function AdminProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-3">
          <Card className="aspect-4/3 w-full border-border/60 bg-muted/30" />
          <div className="flex gap-2">
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 border-border/60 bg-card/60 backdrop-blur-xs space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
