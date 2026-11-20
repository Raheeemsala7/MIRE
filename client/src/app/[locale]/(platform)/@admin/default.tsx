import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { destination } from "@/lib/auth/permissions";

export default async function AdminDefault({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);
  redirect(destination(session.user.role, locale, session.user.permissions));
}
