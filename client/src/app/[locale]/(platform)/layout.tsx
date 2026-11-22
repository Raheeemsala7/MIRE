import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { isAdminRole, isCustomerRole } from "@/lib/auth/roles";
import { normalizeLocale } from "@/lib/auth/permissions";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { getNextAuthToken, clearAuthCookies } from "@/shared/lib/utils/auth.utils";

type PlatformProps = {
  admin: React.ReactNode;
  user: React.ReactNode;
  params: Promise<{ locale: string }>;
};

async function AuthorizedPlatform({ admin, user, params }: PlatformProps) {
  const locale = normalizeLocale((await params).locale);
  const session = await getServerSession();

  // Guest → Public Storefront
  if (!session?.user) {
    return user;
  }

  // Validate backend token isn't expired
  const token = await getNextAuthToken();
  if (!token?.token) {
    await clearAuthCookies();
    if (isAdminRole(session.user.role)) {
      redirect(`/${locale}/auth/login?expired=1`);
    }
    return user;
  }

  // Admin / Staff → Dashboard Slot (when accessing /admin/*) or Storefront (when browsing website /)
  if (isAdminRole(session.user.role)) {
    const headerList = await headers();
    const isAdminRouteHeader = headerList.get("x-is-admin-route");
    const pathnameHeader = headerList.get("x-pathname") || "";

    // If explicitly on storefront routes, allow admin to see the public website
    if (
      isAdminRouteHeader === "0" ||
      pathnameHeader === `/${locale}` ||
      pathnameHeader === `/${locale}/` ||
      pathnameHeader === "/"
    ) {
      return user;
    }

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
