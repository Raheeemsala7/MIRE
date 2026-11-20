import { Skeleton } from "@/shared/components/ui/skeleton";

export function AuthSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6" aria-busy="true">
      <span className="font-serif text-2xl text-ds-text-primary">MIRÉ</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
