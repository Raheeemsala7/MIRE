import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@/auth", () => ({ signOut: mocks.signOut }));
vi.mock("../lib/locale", () => ({ getAuthLocale: async () => "en" }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

beforeEach(() => vi.resetAllMocks());

it("signs out through Auth.js and redirects to login", async () => {
  const { logoutAction } = await import("./logout");
  await expect(logoutAction()).rejects.toThrow("redirect:/en/auth/login");
  expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false });
});
