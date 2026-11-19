import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forgotPasswordAction } from "./forgot-password";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: mocks.getCookie,
    set: mocks.setCookie,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCookie.mockReturnValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("forgot password server action", () => {
  it("submits valid email to backend endpoint and returns success without leaking account existence", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:5000");
    const request = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        statusCode: 200,
        message: "If an account exists with this email, a reset token has been generated.",
        data: { message: "If an account exists with this email, a reset token has been generated." },
      }, { status: 200 }),
    );
    vi.stubGlobal("fetch", request);

    const result = await forgotPasswordAction({ email: "CUSTOMER@EXAMPLE.COM " });
    expect(result).toEqual({ success: true });
    expect(request).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "customer@example.com" }),
        cache: "no-store",
      }),
    );
  });

  it("rejects invalid email formats before hitting the backend", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    const result = await forgotPasswordAction({ email: "not-an-email" });
    expect(result).toMatchObject({
      success: false,
      error: "forgot-error-validation",
      fieldErrors: { email: ["forgot-email-invalid"] },
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("maps 429 rate limiting status to forgot-error-rate-limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Too many requests", { status: 429 })),
    );

    const result = await forgotPasswordAction({ email: "test@example.com" });
    expect(result).toEqual({
      success: false,
      error: "forgot-error-rate-limit",
    });
  });

  it("maps 503 backend failure to forgot-error-unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Service Unavailable", { status: 503 })),
    );

    const result = await forgotPasswordAction({ email: "test@example.com" });
    expect(result).toEqual({
      success: false,
      error: "forgot-error-unavailable",
    });
  });

  it("handles network failure or fetch rejection safely", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused")),
    );

    const result = await forgotPasswordAction({ email: "test@example.com" });
    expect(result).toEqual({
      success: false,
      error: "forgot-error-unavailable",
    });
  });

  it("blocks duplicate submission within 60 seconds even if user refreshes", async () => {
    const futureExpiry = Date.now() + 45_000;
    mocks.getCookie.mockReturnValue({ value: String(futureExpiry) });

    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    const result = await forgotPasswordAction({ email: "customer@example.com" });
    expect(result).toEqual({
      success: false,
      error: "forgot-error-rate-limit",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("sets a 60-second cooldown cookie upon successful submission", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:5000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ success: true, statusCode: 200, message: "OK" }, { status: 200 }),
      ),
    );

    const result = await forgotPasswordAction({ email: "customer@example.com" });
    expect(result).toEqual({ success: true });
    expect(mocks.setCookie).toHaveBeenCalledWith(
      "mire_forgot_cooldown",
      expect.any(String),
      expect.objectContaining({
        maxAge: 60,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  });
});
