import { describe, expect, it } from "vitest";
import { REMEMBER_ME_SECONDS, sessionCookieOptions, sessionDeadline } from "./policy";
import { destination } from "./permissions";
import { loginSchema } from "@/features/auth/schemas/login.schema";

describe("login and session policy", () => {
  it("requires valid credentials input and defaults the form to an explicit boolean", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "", rememberMe: false }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "nour@example.com", password: "secret", rememberMe: false }).success).toBe(true);
  });

  it("uses a fixed 30-day deadline and persistent cookie only when remembered", () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    expect(sessionDeadline(created, true).getTime() - created.getTime()).toBe(REMEMBER_ME_SECONDS * 1000);
    expect(sessionCookieOptions(true, true)).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2592000 });
    expect(sessionCookieOptions(false, true)).not.toHaveProperty("maxAge");
    expect(sessionCookieOptions(false, true)).not.toHaveProperty("expires");
  });

  it("maps backend roles to the appropriate route", () => {
    expect(destination("ADMIN")).toBe("/admin/dashboard");
    expect(destination("SUPER_ADMIN")).toBe("/admin/dashboard");
    expect(destination("CUSTOMER")).toBe("/store");
    expect(destination("ORDER_MANAGER")).toBe("/403");
  });
});
