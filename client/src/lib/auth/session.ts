import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { backendGet, backendPost, backendPatch, backendDelete, BackendApiError } from "./backend-client";
import type { AppRole, SafeUser } from "./types";
import { hasRole } from "./roles";
import { normalizeLocale } from "./permissions";
export { destination } from "./permissions";

/** Compatibility accessors delegate identity entirely to Auth.js. */
export const currentSession = auth;
export async function currentUser(): Promise<SafeUser | null> {
  return (await auth())?.user ?? null;
}

export async function requireRole(roles: readonly AppRole[], locale: string = "ar") {
  const session = await auth();
  const language = normalizeLocale(locale);
  if (!session?.user) redirect(`/${language}/auth/login`);
  if (!hasRole(session.user.role, roles)) redirect(`/${language}/403`);
  return session.user;
}

async function getAccessToken(): Promise<string> {
  const session = await auth();
  const token = (session as any)?.accessToken;
  if (!token) throw new BackendApiError(401);
  return token;
}

export async function serverApiGet<T>(path: `/${string}`): Promise<T> {
  const token = await getAccessToken();
  return backendGet<T>(path, token);
}

export async function serverApiPost<T>(path: `/${string}`, body: unknown): Promise<T> {
  const token = await getAccessToken();
  return backendPost<T>(path, body, token);
}

export async function serverApiPatch<T>(path: `/${string}`, body: unknown): Promise<T> {
  const token = await getAccessToken();
  return backendPatch<T>(path, body, token);
}

export async function serverApiDelete<T>(path: `/${string}`): Promise<T> {
  const token = await getAccessToken();
  return backendDelete<T>(path, token);
}
