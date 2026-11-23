import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function AdminNewReturnLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    </main>
  );
}
