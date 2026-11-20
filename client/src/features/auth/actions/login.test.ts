import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "next-auth";

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error { type = "CredentialsSignin"; } }));

const mocks = vi.hoisted(() => ({
  getIdentity: vi.fn(), signIn: vi.fn(), getSession: vi.fn(), deleteSession: vi.fn(),
  getCookie: vi.fn(), setCookie: vi.fn(), deleteCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.getCookie, set: mocks.setCookie, delete: mocks.deleteCookie }) }));
vi.mock("@/auth", () => ({ signIn: mocks.signIn, handlers: { GET: mocks.getIdentity } }));
vi.mock("@/lib/auth/session-store", () => ({ getSession: mocks.getSession, deleteSession: mocks.deleteSession }));
vi.mock("@/lib/auth/session", () => ({ SESSION_COOKIE: "mire_session", destination: (role: string, locale: string = "ar") => role === "ADMIN" ? `/${locale}/admin/dashboard` : `/${locale}` }));
vi.mock("@/lib/auth/sign-in-proof", () => ({ issueSignInProof: () => "signed-proof" }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getIdentity.mockResolvedValue(Response.json({ user: { id: "user-id", name: "Nour", email: "nour@example.com", role: "CUSTOMER" } }));
  mocks.getCookie.mockImplementation((name?: string) => {
    if (name === "NEXT_LOCALE") return { value: "ar" };
    return { value: "new-session" };
  });
  mocks.getSession.mockResolvedValue({ user: { role: "CUSTOMER" } });
});

describe("server login action", () => {
  it("creates a browser-session cookie when Remember Me is unchecked", async () => {
    const { loginAction } = await import("./login");
    const result = await loginAction({ email: "nour@example.com", password: "password", rememberMe: false });
    expect(result).toEqual({ success: true, destination: "/ar" });
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ rememberMe: "false", proof: "signed-proof" }));
    expect(mocks.setCookie.mock.calls[0][2]).not.toHaveProperty("maxAge");
    expect(mocks.setCookie.mock.calls[0][2]).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("creates a persistent 30-day cookie for an admin who opts in", async () => {
    mocks.getSession.mockResolvedValue({ user: { role: "ADMIN" } });
    mocks.getIdentity.mockResolvedValue(Response.json({ user: { id: "admin-id", role: "ADMIN", permissions: ["dashboard:read"] } }));
    const { loginAction } = await import("./login");
    const result = await loginAction({ email: "admin@mirefashion.com", password: "password", rememberMe: true });
    expect(result).toEqual({ success: true, destination: "/ar/admin/dashboard" });
    expect(mocks.setCookie.mock.calls[0][2].maxAge).toBe(2_592_000);
  });

  it("rejects invalid input before contacting Auth.js", async () => {
    const { loginAction } = await import("./login");
    expect(await loginAction({ email: "bad", password: "", rememberMe: false })).toEqual({ success: false, error: "validation" });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("distinguishes invalid credentials from a backend outage", async () => {
    const { loginAction } = await import("./login");
    const invalid = new AuthError("invalid");
    mocks.signIn.mockRejectedValueOnce(invalid);
    expect(await loginAction({ email: "nour@example.com", password: "wrong", rememberMe: false }))
      .toEqual({ success: false, error: "invalid" });
    const unavailable = Object.assign(new AuthError("unavailable"), { code: "unavailable" });
    mocks.signIn.mockRejectedValueOnce(unavailable);
    expect(await loginAction({ email: "nour@example.com", password: "password", rememberMe: false }))
      .toEqual({ success: false, error: "unavailable" });
  });
});
