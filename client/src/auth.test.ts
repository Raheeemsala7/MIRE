import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ADMIN_ROLES } from "@/lib/auth/roles";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), validated: vi.fn(), revoke: vi.fn() }));
vi.mock("@/lib/auth/session-store", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/auth/backend-session", () => ({ validatedBackendSession: mocks.validated, revokeBackendSession: mocks.revoke }));
vi.mock("@/lib/auth/credentials", () => ({ authorizeCredentials: vi.fn() }));

const id = "a".repeat(43);
const user = { id: "backend-user", name: "Nour", email: "nour@example.com", role: "CUSTOMER" as const, permissions: ["orders:read"] };
const record = { user, expiresAt: new Date("2027-01-01"), accessToken: "private-access", refreshToken: "private-refresh" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUTH_SECRET", "unit-test-secret-with-more-than-thirty-two-characters");
  mocks.getSession.mockResolvedValue(record);
  mocks.validated.mockResolvedValue(record);
});

async function sessionResponse() {
  const { handlers } = await import("./auth");
  return handlers.GET(new NextRequest("http://localhost/api/auth/session", { headers: { cookie: `mire_session=${id}` } }));
}

describe("real Auth.js public session boundary", () => {
  it.each(["CUSTOMER", ...ADMIN_ROLES])("publishes the real user ID and current %s role without secrets", async (role) => {
    mocks.validated.mockResolvedValue({ ...record, user: { ...user, role } });
    const response = await sessionResponse();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ user: { ...user, role }, expires: record.expiresAt.toISOString() });
    expect(JSON.stringify(payload)).not.toMatch(/private-access|private-refresh|sessionId|sessionToken/);
    expect(JSON.stringify(payload)).not.toContain(id);
  });

  it("returns null for expired, deleted, or backend-revoked sessions", async () => {
    mocks.getSession.mockResolvedValueOnce(null);
    expect(await (await sessionResponse()).json()).toBeNull();
    mocks.validated.mockResolvedValueOnce(null);
    expect(await (await sessionResponse()).json()).toBeNull();
  });

  it("replaces old privileges with the current backend role and permissions", async () => {
    mocks.getSession.mockResolvedValue({ ...record, user: { ...user, role: "SUPER_ADMIN" } });
    mocks.validated.mockResolvedValue({ ...record, user: { ...user, permissions: [] } });
    expect((await (await sessionResponse()).json()).user).toEqual({ ...user, permissions: [] });
  });

  it("invalidates the backend reference on Auth.js sign-out", async () => {
    const { handlers } = await import("./auth");
    const csrf = await handlers.GET(new NextRequest("http://localhost/api/auth/csrf"));
    const { csrfToken } = await csrf.json();
    const csrfCookie = csrf.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    await handlers.POST(new NextRequest("http://localhost/api/auth/signout", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: `${csrfCookie}; mire_session=${id}` },
      body: new URLSearchParams({ csrfToken, callbackUrl: "http://localhost/en/auth/login" }),
    }));
    expect(mocks.revoke).toHaveBeenCalledWith(id);
  });
});
