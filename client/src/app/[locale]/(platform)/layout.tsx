import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import { isAdminRole } from "@/lib/auth/roles";
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
  const headerList = await headers();
  const isAdminRouteHeader = headerList.get("x-is-admin-route");
  const pathnameHeader =
    headerList.get("x-pathname") ||
    headerList.get("next-url") ||
    headerList.get("x-matched-path") ||
    "";

  // Explicitly determine if the user is attempting to access an admin section
  const isTargetingAdmin =
    isAdminRouteHeader === "1" ||
    /^\/(ar|en)?\/admin(?:\/|$)/.test(pathnameHeader) ||
    pathnameHeader.includes("/admin");

  // =========================================================================
  // RULE 1: Public Storefront / Landing Page
  // Any visitor, guest, or customer browsing the storefront (/ or /products or /cart)
  // MUST always see the public website. NEVER redirect to login here!
  // =========================================================================
  if (!isTargetingAdmin) {
    return user;
  }

  // =========================================================================
  // RULE 2: Admin Pages Protection (/admin/*)
  // Protected admin routes require authentication, admin role, and a valid token.
  // =========================================================================
  const session = await getServerSession();

  // 1) Not logged in -> Redirect to login page
  if (!session?.user) {
    const callback = encodeURIComponent(pathnameHeader || `/${locale}/admin/dashboard`);
    redirect(`/${locale}/auth/login?callbackUrl=${callback}`);
  }

  // 2) Logged in but not an admin role -> 403 Forbidden
  if (!isAdminRole(session.user.role)) {
    redirect(`/${locale}/403`);
  }

  // 3) Admin role but token expired -> Clear stale cookies & redirect to login
  const token = await getNextAuthToken();
  if (!token?.token) {
    await clearAuthCookies();
    const callback = encodeURIComponent(pathnameHeader || `/${locale}/admin/dashboard`);
    redirect(`/${locale}/auth/login?expired=1&callbackUrl=${callback}`);
  }

  // 4) Authorized Admin -> Render admin dashboard slot
  return admin;
}

export default function PlatformLayout(props: PlatformProps) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthorizedPlatform {...props} />
    </Suspense>
  );
}
