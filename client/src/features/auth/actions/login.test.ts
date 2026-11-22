import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "next-auth";

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type = "CredentialsSignin";
    constructor(type?: string) {
      super(type);
      if (type) this.type = type;
    }
  },
}));

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  auth: vi.fn(),
  getCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));

vi.mock("@/auth", () => ({
  signIn: mocks.signIn,
  auth: mocks.auth,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCookie.mockReturnValue({ value: "ar" });
  mocks.auth.mockResolvedValue({
    user: {
      id: "user-123",
      name: "Customer User",
      email: "user@example.com",
      role: "CUSTOMER",
    },
  });
});

describe("server loginAction", () => {
  it("rejects invalid input before calling NextAuth", async () => {
    const { loginAction } = await import("./login");
    const result = await loginAction({ email: "invalid-email", password: "", rememberMe: false });
    expect(result).toEqual({ success: false, error: "validation" });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("successfully logs in customer and redirects to store root", async () => {
    const { loginAction } = await import("./login");
    const result = await loginAction({
      email: "user@example.com",
      password: "password123",
      rememberMe: false,
    });
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirect: false,
    });
    expect(result).toEqual({ success: true, destination: "/ar" });
  });

  it("successfully logs in admin and redirects to admin dashboard", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "admin-123",
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
        permissions: ["dashboard:read"],
      },
    });
    const { loginAction } = await import("./login");
    const result = await loginAction({
      email: "admin@example.com",
      password: "password123",
      rememberMe: true,
    });
    expect(result).toEqual({ success: true, destination: "/ar/admin/dashboard" });
  });

  it("handles CredentialsSignin as invalid error", async () => {
    mocks.signIn.mockRejectedValueOnce(new AuthError("CredentialsSignin"));
    const { loginAction } = await import("./login");
    const result = await loginAction({
      email: "user@example.com",
      password: "wrong-password",
      rememberMe: false,
    });
    expect(result).toEqual({ success: false, error: "invalid" });
  });

  it("handles other errors as unavailable", async () => {
    mocks.signIn.mockRejectedValueOnce(new Error("Network failed"));
    const { loginAction } = await import("./login");
    const result = await loginAction({
      email: "user@example.com",
      password: "password123",
      rememberMe: false,
    });
    expect(result).toEqual({ success: false, error: "unavailable" });
  });
});
