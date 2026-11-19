import { requireRole } from "@/lib/auth/session";

export const instant = false;

interface AdminDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { locale } = await params;
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"], locale);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <h1 className="font-serif text-4xl sm:text-5xl">Welcome, {user.name}</h1>
      <p className="mt-5 max-w-xl text-ds-text-muted">
        Your MIRÉ administration space is ready. Use your authorized dashboard tools here.
      </p>
      <div className="mt-12 border-t border-ds-border-muted pt-8">
        <p className="text-sm text-ds-text-primary">
          Signed in as {user.role.replaceAll("_", " ").toLowerCase()}
        </p>
      </div>
    </main>
  );
}
