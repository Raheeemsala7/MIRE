import { currentUser } from "@/lib/auth/session";
import { AdminNav } from "@/shared/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <AdminNav currentUser={user}>
      {children}
    </AdminNav>
  );
}
