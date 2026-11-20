import "server-only";
import { cache } from "react";
import { backendMe, backendLogout, BackendApiError, BackendAuthError } from "./backend-client";
import { freshSession } from "./refresh-token";
import { deleteSession, getSession } from "./session-store";

export function isUnauthorized(error: unknown): boolean {
  return (error instanceof BackendApiError || error instanceof BackendAuthError) && error.status === 401;
}

/** Request-local only: every new request rechecks active status and backend permissions. */
export const validatedBackendSession = cache(async (id: string) => {
  let record = await freshSession(id);
  if (!record) return null;
  try {
    let user;
    try {
      user = await backendMe(record.accessToken);
    } catch (error) {
      if (!isUnauthorized(error)) throw error;
      record = await freshSession(id, true, record.version);
      if (!record) return null;
      user = await backendMe(record.accessToken);
    }
    if (user.id !== record.user.id) {
      await deleteSession(id);
      return null;
    }
    return { ...record, user };
  } catch (error) {
    if (isUnauthorized(error) ||
      ((error instanceof BackendApiError || error instanceof BackendAuthError) && error.status === 403)) {
      await deleteSession(id);
      return null;
    }
    // An outage must not fall back to a stale privileged identity.
    throw error;
  }
});

export async function revokeBackendSession(id: string) {
  const record = await getSession(id);
  await deleteSession(id);
  if (record) await backendLogout(record.accessToken);
}
