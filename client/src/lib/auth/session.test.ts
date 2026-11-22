import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireRole, serverApiGet, serverApiPost } from "./session";
import { BackendApiError } from "./backend-client";
import { ADMIN_ROLES } from "./roles";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("./backend-client", async (original) => ({
  ...(await original<typeof import("./backend-client")>()),
  backendGet: mocks.get,
  backendPost: mocks.post,
}));

const user = { id: "backend-id", name: "Nour", email: "nour@example.com", role: "CUSTOMER" as const };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user, accessToken: "valid-jwt-token" });
  mocks.get.mockResolvedValue({ success: true, data: {} });
  mocks.post.mockResolvedValue({ success: true, data: {} });
});

describe("Auth.js session guards and backend transport", () => {
  it.each(["ar", "en"])("redirects unauthenticated users to %s login", async (locale) => {
    mocks.auth.mockResolvedValueOnce(null);
    await expect(requireRole(ADMIN_ROLES, locale)).rejects.toThrow(`redirect:/${locale}/auth/login`);
  });

  it("redirects unauthorized customer role to 403", async () => {
    mocks.auth.mockResolvedValueOnce({ user });
    await expect(requireRole(ADMIN_ROLES, "en")).rejects.toThrow("redirect:/en/403");
  });

  it.each(ADMIN_ROLES)("admits the validated %s role", async (role) => {
    mocks.auth.mockResolvedValue({ user: { ...user, role } });
    expect((await requireRole(ADMIN_ROLES, "en")).role).toBe(role);
  });

  it("throws 401 BackendApiError when there is no active session", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(serverApiGet("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("calls backend with accessToken from current session", async () => {
    await serverApiGet("/products");
    expect(mocks.get).toHaveBeenCalledWith("/products", "valid-jwt-token");
  });

  it("passes body and accessToken on serverApiPost", async () => {
    const body = { name: "New Product" };
    await serverApiPost("/products", body);
    expect(mocks.post).toHaveBeenCalledWith("/products", body, "valid-jwt-token");
  });
});
