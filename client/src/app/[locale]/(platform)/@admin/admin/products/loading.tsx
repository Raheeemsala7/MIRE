import { ProductsSkeleton } from "@/features/products";

export default function AdminProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductsSkeleton />
    </main>
  );
}
