import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const value =
    process.env.TOKEN_ENCRYPTION_KEY ||
    "sCeSZ3xQDvSkfM6drqL2iEoLLKbqMDVHmMclwVIy7lg=";
  if (!value) throw new Error("TOKEN_ENCRYPTION_KEY is required");
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes in base64");
  return decoded;
}

export function newSessionId() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionId(id: string) {
  return createHash("sha256").update(id).digest("hex");
}

export function encrypt(value: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function decrypt(value: string) {
  const data = Buffer.from(value, "base64url");
  if (data.length < 29) throw new Error("Invalid encrypted token");
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
}

export function jwtExpiry(token: string): Date {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Backend token is malformed");
  const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!parsed || typeof parsed !== "object" || !("exp" in parsed) || typeof parsed.exp !== "number") {
    throw new Error("Backend token has no expiration");
  }
  return new Date(parsed.exp * 1000);
}
