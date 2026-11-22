import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getServerSession } from "@/auth";
import type { AppRole, SafeUser } from "./types";
import { hasRole } from "./roles";
import { normalizeLocale } from "./permissions";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { AUTH_COOKIE_NAMES } from "@/shared/constant/auth.constant";
import {
  getNextAuthToken,
  clearAuthCookies,
} from "@/shared/lib/utils/auth.utils";
import { BackendApiError } from "@/lib/auth/backend-client";
export { destination } from "./permissions";
export { clearAuthCookies } from "@/shared/lib/utils/auth.utils";
export { AUTH_COOKIE_NAMES } from "@/shared/constant/auth.constant";

export class SessionExpiredError extends Error {
  readonly status = 401;
  readonly code = "SESSION_EXPIRED";
  constructor(message: string = "Authorization token has expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/** Identity accessors delegating to Auth.js */
export const currentSession = getServerSession;
export async function currentUser(): Promise<SafeUser | null> {
  return (await getServerSession())?.user ?? null;
}

export async function requireRole(roles: readonly AppRole[], locale: string = "ar") {
  const language = normalizeLocale(locale);
  const session = await getServerSession();
  const token = await getNextAuthToken();

  if (!session?.user || !token?.token) {
    await clearAuthCookies();
    redirect(`/${language}/auth/login?expired=1`);
  }
  if (!hasRole(session.user.role, roles)) {
    redirect(`/${language}/403`);
  }
  return session.user;
}

/** Direct native fetch helper with Bearer token authentication */
async function fetchWithAuth<T>(
  path: `/${string}`,
  options: RequestInit = {}
): Promise<T> {
  const token = await getNextAuthToken();
  if (!token?.token) {
    await clearAuthCookies();
    throw new SessionExpiredError("Authorization token has expired");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...HEADERS.JsonBody,
      ...HEADERS.authorize(token.token),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const isExpired =
      res.status === 401 ||
      (typeof data?.message === "string" &&
        (data.message.toLowerCase().includes("expired") ||
          data.message.toLowerCase().includes("unauthorized") ||
          data.message.toLowerCase().includes("invalid token")));

    if (isExpired) {
      const refreshToken = ((token as any).refreshToken || (token.user as any)?.refreshToken) as string | undefined;
      if (refreshToken) {
        try {
          const { backendRefresh } = await import("@/lib/auth/backend-client");
          const refreshed = await backendRefresh(refreshToken);
          if (refreshed?.accessToken) {
            token.token = refreshed.accessToken;
            token.accessToken = refreshed.accessToken;
            if (refreshed.refreshToken) {
              token.refreshToken = refreshed.refreshToken;
            }

            // Retry request with freshly renewed access token
            const retryRes = await fetch(`${API_URL}${path}`, {
              ...options,
              headers: {
                ...HEADERS.JsonBody,
                ...HEADERS.authorize(refreshed.accessToken),
                ...(options.headers || {}),
              },
            });

            const retryData = await retryRes.json().catch(() => null);
            if (retryRes.ok) {
              return retryData as T;
            }
          }
        } catch {
          // Token renewal failed, fall through to clearAuthCookies
        }
      }

      await clearAuthCookies();
      throw new SessionExpiredError(data?.message || "Authorization token has expired");
    }

    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function serverApiGet<T>(path: `/${string}`): Promise<T> {
  return fetchWithAuth<T>(path, { method: "GET", cache: "no-store" });
}

export async function serverApiPost<T>(path: `/${string}`, body: unknown): Promise<T> {
  return fetchWithAuth<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function serverApiPatch<T>(path: `/${string}`, body: unknown): Promise<T> {
  return fetchWithAuth<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function serverApiDelete<T>(path: `/${string}`): Promise<T> {
  return fetchWithAuth<T>(path, { method: "DELETE" });
}

/**
 * Standard API Route Handler error handler:
 * Intercepts expired tokens and 401s, clearing browser cookies and signalling redirect.
 */
export function handleApiError(error: unknown, locale: string = "ar") {
  const isExpired =
    error instanceof SessionExpiredError ||
    (error instanceof Error &&
      (error.message.toLowerCase().includes("expired") ||
        error.message.toLowerCase().includes("unauthorized") ||
        error.message === "Authorization token has expired")) ||
    (error as any)?.status === 401;

  if (isExpired) {
    const response = NextResponse.json(
      {
        success: false,
        code: "SESSION_EXPIRED",
        error: "Authorization token has expired",
        redirectUrl: `/${locale}/auth/login?expired=1`,
      },
      { status: 401 }
    );

    for (const name of AUTH_COOKIE_NAMES) {
      try {
        response.cookies.delete(name);
        response.cookies.set(name, "", {
          maxAge: 0,
          path: "/",
          expires: new Date(0),
          httpOnly: true,
          sameSite: "lax",
        });
      } catch {
        // ignore
      }
    }

    return response;
  }

  if (error instanceof BackendApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.messageText || "Backend error",
        errors: error.errors,
      },
      { status: error.status }
    );
  }

  console.error("API route error:", error);
  return NextResponse.json(
    { success: false, error: (error as Error)?.message || "Failed to process request" },
    { status: 502 }
  );
}
