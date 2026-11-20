import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { destination, normalizeLocale } from "@/lib/auth/permissions";
import { SESSION_COOKIE } from "@/lib/auth/policy";

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(request.cookies.get("NEXT_LOCALE")?.value);
  const session = await auth();
  const target = session?.user
    ? destination(session.user.role, locale, session.user.permissions)
    : `/${locale}/auth/login`;
  const response = NextResponse.redirect(new URL(target, request.url));
  if (!session) response.cookies.delete(SESSION_COOKIE);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
