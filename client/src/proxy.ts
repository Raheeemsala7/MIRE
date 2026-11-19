import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  return cookieLocale && routing.locales.includes(cookieLocale as "ar" | "en")
    ? cookieLocale
    : routing.defaultLocale;
}

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const locale = getLocale(request);

  if (path === "/login" || path === "/auth/login") {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }
  if (path === "/auth/register" || path === "/register") {
    return NextResponse.redirect(new URL(`/${locale}/auth/register`, request.url));
  }
  if (path === "/auth/forgot-password") {
    return NextResponse.redirect(new URL(`/${locale}/auth/forgot-password`, request.url));
  }
  if (path === "/auth/reset-password") {
    const token = request.nextUrl.searchParams.get("token");
    const target = new URL(`/${locale}/auth/reset-password`, request.url);
    if (token) target.searchParams.set("token", token);
    return NextResponse.redirect(target);
  }
  if (path === "/store") {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  if (path === "/admin" || path === "/admin/dashboard") {
    return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, request.url));
  }

  // Admin route protection at the edge (server-side requireRole also enforces this)
  const isAdminRoute = routing.locales.some((loc) => path.startsWith(`/${loc}/admin`));
  if (isAdminRoute && !request.cookies.has("mire_session")) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
