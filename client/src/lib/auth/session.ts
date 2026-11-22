import "server-only";

import { redirect } from "next/navigation";
import { getServerSession } from "@/auth";
import type { AppRole, SafeUser } from "./types";
import { hasRole } from "./roles";
import { normalizeLocale } from "./permissions";
import { API_URL, HEADERS } from "@/shared/constant/api.constant";
import { getNextAuthToken } from "@/shared/lib/utils/auth.utils";
export { destination } from "./permissions";

/** Identity accessors delegating to Auth.js */
export const currentSession = getServerSession;
export async function currentUser(): Promise<SafeUser | null> {
  return (await getServerSession())?.user ?? null;
}

export async function requireRole(roles: readonly AppRole[], locale: string = "ar") {
  const session = await getServerSession();
  const language = normalizeLocale(locale);
  if (!session?.user) redirect(`/${language}/auth/login`);
  if (!hasRole(session.user.role, roles)) redirect(`/${language}/403`);
  return session.user;
}

/** Direct native fetch helper with Bearer token authentication */
async function fetchWithAuth<T>(
  path: `/${string}`,
  options: RequestInit = {}
): Promise<T> {
  const token = await getNextAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...HEADERS.JsonBody,
      ...(token?.token ? HEADERS.authorize(token.token) : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
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
