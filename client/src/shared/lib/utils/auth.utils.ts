"use server";

import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function getNextAuthToken() {
  const cookiesStore = await cookies();
  const configuredName = process.env.NEXT_AUTH_SESSION_COOKIE_NAME;
  const token =
    (configuredName ? cookiesStore.get(configuredName)?.value : undefined) ||
    cookiesStore.get("authjs.session-token")?.value ||
    cookiesStore.get("__Secure-authjs.session-token")?.value ||
    cookiesStore.get("next-auth.session-token")?.value ||
    cookiesStore.get("__Secure-next-auth.session-token")?.value;

  try {
    const jwt = await decode({
      token,
      secret: (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)!,
      salt: (configuredName || "authjs.session-token") as any,
    } as any);
    if (jwt) {
      if (!jwt.token && jwt.accessToken) {
        jwt.token = jwt.accessToken as string;
      }
    }
    return jwt;
  } catch {
    return null;
  }
}
