import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
  return value;
}

export function issueSignInProof(email: string, rememberMe: boolean) {
  const issuedAt = Date.now();
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${email.toLowerCase()}|${rememberMe}|${issuedAt}|${nonce}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${issuedAt}.${nonce}.${signature}`;
}

export function verifySignInProof(value: unknown, email: string, rememberMe: boolean) {
  if (typeof value !== "string") return false;
  const [time, nonce, signature, extra] = value.split(".");
  const issuedAt = Number(time);
  if (extra || !Number.isSafeInteger(issuedAt) || issuedAt > Date.now() || Date.now() - issuedAt > 30_000 ||
    !nonce || !signature) return false;
  const payload = `${email.toLowerCase()}|${rememberMe}|${issuedAt}|${nonce}`;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const provided = Buffer.from(signature, "base64url");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
