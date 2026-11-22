import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({
  connection: vi.fn(),
}));

const mockBackendLogin = vi.fn();
vi.mock("@/lib/auth/backend-client", () => ({
  backendLogin: (...args: unknown[]) => mockBackendLogin(...args),
}));

describe("Auth.js configuration and callbacks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("exports handlers, signIn, signOut, auth", async () => {
    const authModule = await import("./auth");
    expect(authModule.handlers).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
    expect(authModule.auth).toBeDefined();
  });
});
