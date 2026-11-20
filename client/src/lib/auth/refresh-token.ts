import "server-only";
import { backendRefresh, BackendAuthError } from "./backend-client";
import { claimRefresh, deleteSession, getSession, releaseRefresh, saveRotatedTokens } from "./session-store";
import type { SessionRecord } from "./types";

export async function freshSession(id: string, force = false, failedVersion?: number): Promise<SessionRecord | null> {
  let session = await getSession(id);
  if (!session) return null;
  // A concurrent request may already have replaced the access token that failed.
  if (force && failedVersion !== undefined && session.version > failedVersion &&
    session.accessTokenExpiresAt.getTime() > Date.now() + 60_000) return session;
  if (!force && session.accessTokenExpiresAt.getTime() > Date.now() + 60_000) return session;
  if (session.refreshTokenExpiresAt.getTime() <= Date.now()) {
    await deleteSession(id);
    return null;
  }
  const previousVersion = session.version;
  const claimed = await claimRefresh(id, session.version);
  if (claimed) {
    try {
      const rotated = await backendRefresh(session.refreshToken);
      if (!await saveRotatedTokens(id, session.version, rotated.accessToken, rotated.refreshToken)) {
        await deleteSession(id);
        return null;
      }
      return getSession(id);
    } catch (error) {
      if (error instanceof BackendAuthError && [400, 401, 403].includes(error.status)) {
        await deleteSession(id);
        return null;
      }
      await releaseRefresh(id, session.version);
      throw error;
    }
  }
  // Another instance owns the lease. Wait briefly, then read its committed rotation.
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    session = await getSession(id);
    if (!session) return null;
    if (session.version > previousVersion &&
      session.accessTokenExpiresAt.getTime() > Date.now() + 60_000) return session;
  }
  throw new Error("Token refresh is in progress");
}
