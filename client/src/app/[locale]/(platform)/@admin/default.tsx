import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/auth";
import { destination } from "@/lib/auth/permissions";

export default async function AdminDefault({ params }: { params: Promise<{ locale: string }> }) {
  const headerList = await headers();
  const isAdminRoute = headerList.get("x-is-admin-route");
  if (isAdminRoute === "0") {
    return null;
  }

  const { locale } = await params;
  const session = await getServerSession();
  if (!session?.user) redirect(`/${locale}/auth/login`);
  redirect(destination(session.user.role, locale, session.user.permissions));
}
