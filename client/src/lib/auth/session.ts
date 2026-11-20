import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { backendGet, backendPost, backendPatch, BackendApiError } from "./backend-client";
import { validatedBackendSession, isUnauthorized } from "./backend-session";
import { freshSession } from "./refresh-token";
import { deleteSession } from "./session-store";
import type { AppRole, SafeUser } from "./types";
import { SESSION_COOKIE } from "./policy";
import { hasRole } from "./roles";
import { normalizeLocale } from "./permissions";
export { destination } from "./permissions";
export { SESSION_COOKIE } from "./policy";

/** Compatibility accessors delegate identity entirely to Auth.js. No tokens returned. */
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

/** Transport only: Auth.js authorizes identity, the backend authorizes the operation. */
async function backendRequest<T>(operation: (accessToken: string) => Promise<T>): Promise<T> {
  const identity = await auth();
  if (!identity?.user) throw new BackendApiError(401);
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) throw new BackendApiError(401);
  let record = await validatedBackendSession(id);
  if (!record || record.user.id !== identity.user.id) throw new BackendApiError(401);
  try { return await operation(record.accessToken); }
  catch (error) {
    if (!isUnauthorized(error)) throw error;
    record = await freshSession(id, true, record.version);
    if (!record) throw new BackendApiError(401);
    try { return await operation(record.accessToken); }
    catch (retryError) {
      if (isUnauthorized(retryError)) await deleteSession(id);
      throw retryError;
    }
  }
}

export async function serverApiGet<T>(path: `/${string}`): Promise<T> {
  return backendRequest((token) => backendGet<T>(path, token));
}
export async function serverApiPost<T>(path: `/${string}`, body: unknown): Promise<T> {
  return backendRequest((token) => backendPost<T>(path, body, token));
}
export async function serverApiPatch<T>(path: `/${string}`, body: unknown): Promise<T> {
  return backendRequest((token) => backendPatch<T>(path, body, token));
}
