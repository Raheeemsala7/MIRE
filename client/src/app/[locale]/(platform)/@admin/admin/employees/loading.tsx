import { EmployeesSkeleton } from "@/features/employees";

export default function EmployeesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <EmployeesSkeleton />
    </main>
  );
}
