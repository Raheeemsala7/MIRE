import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireRole, serverApiGet } from "./session";
import { BackendApiError } from "./backend-client";
import { ADMIN_ROLES } from "./roles";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ auth: vi.fn(), validated: vi.fn(), fresh: vi.fn(), remove: vi.fn(), get: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "opaque-id" }) }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("./backend-session", () => ({ validatedBackendSession: mocks.validated,
  isUnauthorized: (error: unknown) => error instanceof BackendApiError && error.status === 401 }));
vi.mock("./refresh-token", () => ({ freshSession: mocks.fresh }));
vi.mock("./session-store", () => ({ deleteSession: mocks.remove }));
vi.mock("./backend-client", async (original) => ({ ...await original<typeof import("./backend-client")>(), backendGet: mocks.get }));
const user = { id: "backend-id", name: "Nour", email: "nour@example.com", role: "CUSTOMER" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user });
  mocks.validated.mockResolvedValue({ user, accessToken: "old-token", version: 0 });
  mocks.fresh.mockResolvedValue({ user, accessToken: "new-token", version: 1 });
});

describe("Auth.js server guards and backend transport", () => {
  it.each(["ar", "en"])("redirects guests to the %s login and rejects customers from admin", async (locale) => {
    mocks.auth.mockResolvedValueOnce(null);
    await expect(requireRole(ADMIN_ROLES, locale)).rejects.toThrow(`redirect:/${locale}/auth/login`);
    await expect(requireRole(ADMIN_ROLES, locale)).rejects.toThrow(`redirect:/${locale}/403`);
  });
  it.each(ADMIN_ROLES)("admits the validated %s role", async (role) => {
    mocks.auth.mockResolvedValue({ user: { ...user, role } });
    expect((await requireRole(ADMIN_ROLES, "en")).role).toBe(role);
  });
  it("does not use stored tokens when Auth.js has no identity", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(serverApiGet("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("retries exactly once on backend 401 and revokes on repeated rejection", async () => {
    mocks.get.mockRejectedValue(new BackendApiError(401));
    await expect(serverApiGet("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.get).toHaveBeenLastCalledWith("/auth/me", "new-token");
    expect(mocks.fresh).toHaveBeenCalledWith("opaque-id", true, 0);
    expect(mocks.remove).toHaveBeenCalledWith("opaque-id");
  });
  it("keeps a backend permission denial authoritative without refresh retries", async () => {
    mocks.get.mockRejectedValue(new BackendApiError(403));
    await expect(serverApiGet("/employees")).rejects.toMatchObject({ status: 403 });
    expect(mocks.fresh).not.toHaveBeenCalled();
  });
});
