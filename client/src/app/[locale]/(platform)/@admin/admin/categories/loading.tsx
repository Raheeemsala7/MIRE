import { CategoriesSkeleton } from "@/features/categories";

export default function AdminCategoriesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CategoriesSkeleton />
    </main>
  );
}
