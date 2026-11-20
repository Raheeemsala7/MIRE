import "server-only";
import { connection as requestConnection } from "next/server";
import { MongoClient, type Collection } from "mongodb";
import { decrypt, encrypt, hashSessionId, jwtExpiry, newSessionId } from "./crypto";
import type { SafeUser, SessionRecord } from "./types";
import { sessionDeadline, SESSION_IDLE_MS } from "./policy";

type StoredSession = Omit<SessionRecord, "accessToken" | "refreshToken"> & {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
};

let connection: Promise<MongoClient> | undefined;
let indexReady: Promise<void> | undefined;

async function collection(): Promise<Collection<StoredSession>> {
  const uri = process.env.SESSION_MONGODB_URI;
  if (!uri) throw new Error("SESSION_MONGODB_URI is required");
  connection ??= new MongoClient(uri).connect().catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  const client = await connection;
  const sessions = client.db().collection<StoredSession>("next_auth_sessions");
  indexReady ??= sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).then(() => undefined).catch((error: unknown) => {
    indexReady = undefined;
    throw error;
  });
  await indexReady;
  return sessions;
}

function unpack(value: StoredSession): SessionRecord {
  const { encryptedAccessToken, encryptedRefreshToken, ...safe } = value;
  return { ...safe, accessToken: decrypt(encryptedAccessToken), refreshToken: decrypt(encryptedRefreshToken) };
}

export async function createSession(user: SafeUser, accessToken: string, refreshToken: string, rememberMe: boolean) {
  const id = newSessionId();
  const now = new Date();
  const expiresAt = sessionDeadline(now, rememberMe);
  const document: StoredSession = {
    _id: hashSessionId(id), user, rememberMe, createdAt: now, expiresAt,
    lastActivityAt: now, encryptedAccessToken: encrypt(accessToken),
    encryptedRefreshToken: encrypt(refreshToken), accessTokenExpiresAt: jwtExpiry(accessToken),
    refreshTokenExpiresAt: jwtExpiry(refreshToken), version: 0,
  };
  await (await collection()).insertOne(document);
  return id;
}

export async function getSession(id: string): Promise<SessionRecord | null> {
  if (!/^[\w-]{40,64}$/.test(id)) return null;
  // Partial prefetches can already know the cookie. MongoDB's internal clocks
  // and session expiry checks must still wait for an actual request.
  await requestConnection();
  const sessions = await collection();
  const document = await sessions.findOne({ _id: hashSessionId(id) });
  if (!document) return null;
  const now = Date.now();
  if (document.expiresAt.getTime() <= now || (!document.rememberMe && document.lastActivityAt.getTime() + SESSION_IDLE_MS <= now)) {
    await sessions.deleteOne({ _id: document._id });
    return null;
  }
  if (!document.rememberMe) {
    const idleDeadline = new Date(now + SESSION_IDLE_MS);
    await sessions.updateOne({ _id: document._id }, { $set: {
      lastActivityAt: new Date(now), expiresAt: idleDeadline,
    } });
    document.lastActivityAt = new Date(now);
    document.expiresAt = idleDeadline;
  }
  return unpack(document);
}

export async function deleteSession(id: string) {
  if (/^[\w-]{40,64}$/.test(id)) await (await collection()).deleteOne({ _id: hashSessionId(id) });
}

export async function claimRefresh(id: string, version: number, leaseMs = 15_000) {
  const now = new Date();
  return (await collection()).findOneAndUpdate(
    { _id: hashSessionId(id), version, expiresAt: { $gt: now },
      $or: [{ refreshLeaseUntil: { $exists: false } }, { refreshLeaseUntil: { $lte: now } }] },
    { $set: { refreshLeaseUntil: new Date(now.getTime() + leaseMs) } },
    { returnDocument: "after" },
  );
}

export async function saveRotatedTokens(id: string, version: number, accessToken: string, refreshToken: string) {
  const result = await (await collection()).updateOne(
    { _id: hashSessionId(id), version, refreshLeaseUntil: { $gt: new Date() } },
    { $set: { encryptedAccessToken: encrypt(accessToken), encryptedRefreshToken: encrypt(refreshToken),
      accessTokenExpiresAt: jwtExpiry(accessToken), refreshTokenExpiresAt: jwtExpiry(refreshToken) },
      $inc: { version: 1 }, $unset: { refreshLeaseUntil: "" } },
  );
  return result.modifiedCount === 1;
}

export async function releaseRefresh(id: string, version: number) {
  await (await collection()).updateOne({ _id: hashSessionId(id), version }, { $unset: { refreshLeaseUntil: "" } });
}
