import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { backendGet, BackendAuthError } from "./backend-client";
import { freshSession } from "./refresh-token";
import { deleteSession } from "./session-store";
import type { AppRole, SafeUser } from "./types";
import { SESSION_COOKIE } from "./policy";
export { destination } from "./permissions";
export { SESSION_COOKIE } from "./policy";

export async function currentSession() {
  await connection();
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return id ? freshSession(id) : null;
}

export async function currentUser(): Promise<SafeUser | null> {
  return (await currentSession())?.user ?? null;
}

export async function requireRole(roles: AppRole[], locale: string = "ar") {
  const session = await currentSession();
  if (!session) redirect(`/api/auth/clear-session?callbackUrl=/${locale}/auth/login`);
  if (!roles.includes(session.user.role)) redirect(`/${locale}/403`);
  return session.user;
}

export async function serverApiGet<T>(path: `/${string}`): Promise<T> {
  await connection();
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) redirect("/login");
  let session = await freshSession(id);
  if (!session) redirect("/api/auth/clear-session");
  try { return await backendGet<T>(path, session.accessToken); }
  catch (error) {
    if (!(error instanceof BackendAuthError) || error.status !== 401) throw error;
    session = await freshSession(id, true);
    if (!session) redirect("/api/auth/clear-session");
    try { return await backendGet<T>(path, session.accessToken); }
    catch (retryError) {
      if (retryError instanceof BackendAuthError && retryError.status === 401) {
        await deleteSession(id);
        redirect("/api/auth/clear-session");
      }
      throw retryError;
    }
  }
}
