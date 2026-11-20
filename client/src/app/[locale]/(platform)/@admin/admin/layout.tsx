import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { AdminNav } from "@/shared/components/admin-nav";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

type AdminProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};
async function AuthorizedAdmin({ children, params }: AdminProps) {
  const { locale } = await params;
  const user = await requireRole(ADMIN_ROLES, locale);
  return <AdminNav currentUser={user}>{children}</AdminNav>;
}
export default function AdminLayout(props: AdminProps) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthorizedAdmin {...props} />
    </Suspense>
  );
}
