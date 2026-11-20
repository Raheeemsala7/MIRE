import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackendApiError } from "./backend-client";
import { validatedBackendSession, revokeBackendSession } from "./backend-session";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ fresh: vi.fn(), me: vi.fn(), get: vi.fn(), remove: vi.fn(), logout: vi.fn() }));
vi.mock("./refresh-token", () => ({ freshSession: mocks.fresh }));
vi.mock("./session-store", () => ({ getSession: mocks.get, deleteSession: mocks.remove }));
vi.mock("./backend-client", async (original) => ({ ...await original<typeof import("./backend-client")>(), backendMe: mocks.me, backendLogout: mocks.logout }));
const user = { id: "backend-user", name: "Nour", email: "nour@example.com", role: "CUSTOMER", permissions: [] };
const record = { user: { ...user, role: "ADMIN" }, accessToken: "access", version: 0 };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.fresh.mockResolvedValue(record);
  mocks.get.mockResolvedValue(record);
  mocks.me.mockResolvedValue(user);
});

describe("backend identity revalidation", () => {
  it("refreshes stale role metadata before publishing identity", async () => {
    expect((await validatedBackendSession("session"))?.user).toEqual(user);
  });
  it("does not authenticate missing or expired sessions", async () => {
    mocks.fresh.mockResolvedValue(null);
    expect(await validatedBackendSession("session")).toBeNull();
    expect(mocks.me).not.toHaveBeenCalled();
  });
  it("retries an expired access token once with the rotated token", async () => {
    mocks.me.mockRejectedValueOnce(new BackendApiError(401));
    mocks.fresh.mockResolvedValueOnce(record).mockResolvedValueOnce({ ...record, accessToken: "rotated" });
    expect((await validatedBackendSession("session"))?.user).toEqual(user);
    expect(mocks.fresh).toHaveBeenLastCalledWith("session", true, 0);
    expect(mocks.me).toHaveBeenLastCalledWith("rotated");
  });
  it.each([401, 403])("revokes a session if the backend rejects identity with %s", async (status) => {
    mocks.me.mockRejectedValue(new BackendApiError(status));
    expect(await validatedBackendSession("session")).toBeNull();
    expect(mocks.remove).toHaveBeenCalledWith("session");
    expect(mocks.me.mock.calls.length).toBeLessThanOrEqual(2);
  });
  it("rejects identity substitution and never falls back during outages", async () => {
    mocks.me.mockResolvedValueOnce({ ...user, id: "another-user" });
    expect(await validatedBackendSession("session")).toBeNull();
    mocks.me.mockRejectedValueOnce(new BackendApiError(503));
    await expect(validatedBackendSession("session")).rejects.toMatchObject({ status: 503 });
  });
  it("deletes the local session before attempting backend logout", async () => {
    await revokeBackendSession("session");
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeLessThan(mocks.logout.mock.invocationCallOrder[0]);
  });
});
