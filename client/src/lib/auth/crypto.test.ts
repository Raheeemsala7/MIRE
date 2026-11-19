import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeAll(() => { process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); process.env.AUTH_SECRET = "test-secret-with-at-least-thirty-two-characters"; });

describe("session secrets", () => {
  it("encrypts tokens at rest and rejects tampering", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const value = "backend-secret-token";
    const encrypted = encrypt(value);
    expect(encrypted).not.toContain(value);
    expect(decrypt(encrypted)).toBe(value);
    const bytes = Buffer.from(encrypted, "base64url");
    bytes[bytes.length - 1] ^= 1;
    expect(() => decrypt(bytes.toString("base64url"))).toThrow();
  });

  it("binds short-lived sign-in proof to email and remember-me choice", async () => {
    const { issueSignInProof, verifySignInProof } = await import("./sign-in-proof");
    const proof = issueSignInProof("nour@example.com", true);
    expect(verifySignInProof(proof, "nour@example.com", true)).toBe(true);
    expect(verifySignInProof(proof, "other@example.com", true)).toBe(false);
    expect(verifySignInProof(proof, "nour@example.com", false)).toBe(false);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 31_000);
    expect(verifySignInProof(proof, "nour@example.com", true)).toBe(false);
    vi.useRealTimers();
  });
});
