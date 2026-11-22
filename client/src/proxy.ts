import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function getLocale(request: NextRequest): string {
  const pathLocale = request.nextUrl.pathname.split("/")[1];
  if (pathLocale === "ar" || pathLocale === "en") return pathLocale;
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  return cookieLocale === "ar" || cookieLocale === "en"
    ? cookieLocale
    : routing.defaultLocale;
}

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const locale = getLocale(request);

  if (path === "/login" || path === "/auth/login") {
    const target = new URL(`/${locale}/auth/login`, request.url);
    const callback = request.nextUrl.searchParams.get("callbackUrl");
    if (callback) target.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(target);
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
  if (
    path === "/admin" ||
    path === "/admin/" ||
    path === "/admin/dashboard" ||
    path === "/ar/admin" ||
    path === "/ar/admin/" ||
    path === "/en/admin" ||
    path === "/en/admin/"
  ) {
    return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, request.url));
  }

  // Admin route protection at the edge (server-side requireRole also enforces this)
  const isAdminRoute = /^\/(ar|en)\/admin(?:\/|$)/.test(path);
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (isAdminRoute && !hasSession) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  request.headers.set("x-is-admin-route", isAdminRoute ? "1" : "0");
  request.headers.set("x-pathname", path);
  const response = intlMiddleware(request);
  response.headers.set("x-is-admin-route", isAdminRoute ? "1" : "0");
  response.headers.set("x-pathname", path);
  return response;
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
