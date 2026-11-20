import { handlers } from "@/auth";
import type { NextRequest } from "next/server";
import { preserveSessionCookiePolicy } from "@/lib/auth/handler-cookies";

export async function GET(request: NextRequest) {
  return preserveSessionCookiePolicy(await handlers.GET(request));
}
export async function POST(request: NextRequest) {
  return preserveSessionCookiePolicy(await handlers.POST(request));
}
