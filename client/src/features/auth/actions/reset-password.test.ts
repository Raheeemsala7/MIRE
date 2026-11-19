import { afterEach, describe, expect, it, vi } from "vitest";
import { resetPasswordAction } from "./reset-password";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("reset password server action", () => {
  const validPayload = {
    token: "sample-valid-token-12345",
    password: "NewPassword123!",
    confirmPassword: "NewPassword123!",
  };

  it("submits valid token and password to backend reset-password endpoint", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:5000");
    const request = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        statusCode: 200,
        message: "Password successfully updated",
      }, { status: 200 }),
    );
    vi.stubGlobal("fetch", request);

    const result = await resetPasswordAction(validPayload);
    expect(result).toEqual({ success: true });
    expect(request).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "sample-valid-token-12345", password: "NewPassword123!" }),
        cache: "no-store",
      }),
    );
  });

  it("rejects password mismatch on server before contacting backend", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    const result = await resetPasswordAction({
      ...validPayload,
      confirmPassword: "DifferentPassword123!",
    });
    expect(result).toMatchObject({
      success: false,
      error: "reset-error-validation",
      fieldErrors: { confirmPassword: ["reset-password-mismatch"] },
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("rejects password failing policy (e.g. no symbol)", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    const result = await resetPasswordAction({
      ...validPayload,
      password: "NoSymbolPassword1",
      confirmPassword: "NoSymbolPassword1",
    });
    expect(result).toMatchObject({
      success: false,
      error: "reset-error-validation",
      fieldErrors: { password: ["reset-password-pattern"] },
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("maps 400 invalid/expired token response from backend to reset-error-invalid-token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Password reset token is invalid or has expired", { status: 400 })),
    );

    const result = await resetPasswordAction(validPayload);
    expect(result).toEqual({
      success: false,
      error: "reset-error-invalid-token",
    });
  });

  it("maps 429 rate limit to reset-error-rate-limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Too many requests", { status: 429 })),
    );

    const result = await resetPasswordAction(validPayload);
    expect(result).toEqual({
      success: false,
      error: "reset-error-rate-limit",
    });
  });

  it("handles backend outage (503) safely", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Service Unavailable", { status: 503 })),
    );

    const result = await resetPasswordAction(validPayload);
    expect(result).toEqual({
      success: false,
      error: "reset-error-unavailable",
    });
  });
});
