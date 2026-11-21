import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole, isCustomerRole } from "@/lib/auth/roles";
import { normalizeLocale } from "@/lib/auth/permissions";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

type PlatformProps = {
  admin: React.ReactNode;
  user: React.ReactNode;
  params: Promise<{ locale: string }>;
};

async function AuthorizedPlatform({ admin, user, params }: PlatformProps) {
  const locale = normalizeLocale((await params).locale);
  const session = await auth();

  // Guest → Public Storefront
  if (!session?.user) {
    return user;
  }

  // Admin / Staff → Dashboard Slot
  if (isAdminRole(session.user.role)) {
    return admin;
  }

  // Customer → Storefront
  if (isCustomerRole(session.user.role)) {
    return user;
  }

  redirect(`/${locale}/403`);
}

export default function PlatformLayout(props: PlatformProps) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthorizedPlatform {...props} />
    </Suspense>
  );
}
