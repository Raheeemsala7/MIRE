import { beforeEach, expect, it, vi } from "vitest";
import { logoutAction } from "./logout";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ signOut: vi.fn(), revoke: vi.fn(), clear: vi.fn() }));
vi.mock("@/auth", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/auth/backend-session", () => ({ revokeBackendSession: mocks.revoke }));
vi.mock("../lib/locale", () => ({ getAuthLocale: async () => "en" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "private-reference" }), delete: mocks.clear }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
beforeEach(() => vi.resetAllMocks());
it("revokes backend state and signs out through Auth.js before a localized redirect", async () => {
  await expect(logoutAction()).rejects.toThrow("redirect:/en/auth/login");
  expect(mocks.revoke).toHaveBeenCalledWith("private-reference");
  expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false });
  expect(mocks.clear).toHaveBeenCalledWith("mire_session");
  expect(mocks.revoke.mock.invocationCallOrder[0]).toBeLessThan(mocks.signOut.mock.invocationCallOrder[0]);
});
