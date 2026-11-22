"use server";

import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAMES } from "@/shared/constant/auth.constant";

/** Helper to delete all NextAuth session cookies in server action / route handler context */
export async function clearAuthCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();
    for (const name of AUTH_COOKIE_NAMES) {
      cookieStore.delete(name);
    }
  } catch {
    // Cannot mutate cookies in read-only Server Component context
  }
}

/** Check if a raw JWT string is expired */
function isJwtExpired(tokenString?: string): boolean {
  if (!tokenString || typeof tokenString !== "string") return false;
  try {
    const parts = tokenString.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload);
    if (payload?.exp && typeof payload.exp === "number") {
      // If expired or expiring within next 5 seconds
      return payload.exp * 1000 <= Date.now() + 5000;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getNextAuthToken() {
  const cookiesStore = await cookies();
  const configuredName = process.env.NEXT_AUTH_SESSION_COOKIE_NAME;
  let cookieName = configuredName;
  let token = configuredName ? cookiesStore.get(configuredName)?.value : undefined;

  if (!token) {
    const candidateNames = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
    ];
    for (const name of candidateNames) {
      const val = cookiesStore.get(name)?.value;
      if (val) {
        token = val;
        cookieName = name;
        break;
      }
    }
  }

  if (!token) return null;

  try {
    const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)!;
    const salt = cookieName || configuredName || "authjs.session-token";

    let jwt = await decode({
      token,
      secret,
      salt,
    } as any).catch(() => null);

    if (!jwt && salt !== "authjs.session-token") {
      jwt = await decode({
        token,
        secret,
        salt: "authjs.session-token",
      } as any).catch(() => null);
    }

    if (!jwt) return null;

    // If NextAuth outer session token is expired, clear cookies and return null
    if (jwt?.exp && typeof jwt.exp === "number" && jwt.exp * 1000 < Date.now()) {
      await clearAuthCookies();
      return null;
    }

    if (jwt) {
      if (!jwt.token && jwt.accessToken) {
        jwt.token = jwt.accessToken as string;
      }
    }

    // Check inner backend JWT accessToken expiration
    const innerToken = (jwt?.token || jwt?.accessToken) as string | undefined;
    if (innerToken && isJwtExpired(innerToken)) {
      await clearAuthCookies();
      return null;
    }

    return jwt;
  } catch {
    return null;
  }
}
