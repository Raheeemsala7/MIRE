import { NextRequest, NextResponse } from "next/server";
import { destination, SESSION_COOKIE } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session-store";

export async function GET(request: NextRequest) {
  const id = request.cookies.get(SESSION_COOKIE)?.value;
  const record = id ? await getSession(id) : null;
  if (record) return NextResponse.redirect(new URL(destination(record.user.role), request.url));
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
