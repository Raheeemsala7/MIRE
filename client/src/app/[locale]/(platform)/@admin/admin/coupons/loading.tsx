import { CouponsSkeleton } from "@/features/admin/coupons";

export default function CouponsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="h-14 w-72 rounded-2xl bg-muted/40 animate-pulse" />
      <CouponsSkeleton />
    </main>
  );
}
