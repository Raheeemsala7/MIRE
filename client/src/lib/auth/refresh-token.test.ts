import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionRecord } from "./types";

vi.mock("server-only", () => ({}));

const store = vi.hoisted(() => ({
  getSession: vi.fn(), claimRefresh: vi.fn(), deleteSession: vi.fn(),
  releaseRefresh: vi.fn(), saveRotatedTokens: vi.fn(),
}));
const backend = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("./session-store", () => store);
vi.mock("./backend-client", () => ({
  backendRefresh: backend.refresh,
  BackendAuthError: class BackendAuthError extends Error {
    constructor(public status: number) { super("backend"); }
  },
}));

function record(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    _id: "hash", user: { id: "user", name: "Nour", email: "nour@example.com", role: "CUSTOMER" },
    rememberMe: true, createdAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000),
    lastActivityAt: new Date(), accessToken: "old-access", refreshToken: "old-refresh",
    accessTokenExpiresAt: new Date(Date.now() - 1), refreshTokenExpiresAt: new Date(Date.now() + 3_600_000),
    version: 0, ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  store.getSession.mockResolvedValue(record());
  store.claimRefresh.mockResolvedValue({ _id: "hash" });
  store.saveRotatedTokens.mockResolvedValue(true);
});

describe("server token rotation", () => {
  it("rotates both tokens and keeps the existing session deadline", async () => {
    const old = record();
    const updated = record({ accessToken: "new-access", refreshToken: "new-refresh", version: 1,
      accessTokenExpiresAt: new Date(Date.now() + 3_600_000), expiresAt: old.expiresAt });
    store.getSession.mockResolvedValueOnce(old).mockResolvedValueOnce(updated);
    backend.refresh.mockResolvedValue({ accessToken: "new-access", refreshToken: "new-refresh" });
    const { freshSession } = await import("./refresh-token");
    expect((await freshSession("opaque-id"))?.accessToken).toBe("new-access");
    expect(backend.refresh).toHaveBeenCalledWith("old-refresh");
    expect(store.saveRotatedTokens).toHaveBeenCalledWith("opaque-id", 0, "new-access", "new-refresh");
    expect(updated.expiresAt).toEqual(old.expiresAt);
  });

  it("invalidates sessions whose backend refresh token has expired", async () => {
    store.getSession.mockResolvedValue(record({ refreshTokenExpiresAt: new Date(Date.now() - 1) }));
    const { freshSession } = await import("./refresh-token");
    expect(await freshSession("opaque-id")).toBeNull();
    expect(store.deleteSession).toHaveBeenCalledWith("opaque-id");
    expect(backend.refresh).not.toHaveBeenCalled();
  });

  it("waits for the winning rotation instead of reusing the old token", async () => {
    const original = record();
    const updated = record({ version: 1, accessToken: "new-access", refreshToken: "new-refresh",
      accessTokenExpiresAt: new Date(Date.now() + 3_600_000) });
    let rotated = false;
    store.getSession.mockImplementation(async () => rotated ? updated : original);
    store.claimRefresh.mockResolvedValueOnce({ _id: "hash" }).mockResolvedValueOnce(null);
    backend.refresh.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { accessToken: "new-access", refreshToken: "new-refresh" };
    });
    store.saveRotatedTokens.mockImplementation(async () => { rotated = true; return true; });
    const { freshSession } = await import("./refresh-token");
    const [first, second] = await Promise.all([freshSession("opaque-id"), freshSession("opaque-id")]);
    expect(first?.accessToken).toBe("new-access");
    expect(second?.accessToken).toBe("new-access");
    expect(backend.refresh).toHaveBeenCalledTimes(1);
  });
});
