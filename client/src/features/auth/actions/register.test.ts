import { afterEach, describe, expect, it, vi } from "vitest";
import { registerAction } from "./register";

vi.mock("server-only", () => ({}));

const fields = { name: "Hala Mahmoud", email: "hala@example.com", password: "Secret123!", phone: "+201001234567" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("registration server boundary", () => {
  it("uses the same backend base as login and never returns backend tokens", async () => {
    vi.stubEnv("BACKEND_API_URL", "http://localhost:5000");
    const request = vi.fn().mockResolvedValue(Response.json({
      success: true, statusCode: 201,
      data: { accessToken: "private-access", refreshToken: "private-refresh" },
    }, { status: 201 }));
    vi.stubGlobal("fetch", request);
    expect(await registerAction(fields)).toEqual({ success: true });
    expect(request).toHaveBeenCalledWith("http://localhost:5000/api/v1/auth/register", expect.objectContaining({
      method: "POST", body: JSON.stringify(fields), cache: "no-store",
    }));
  });

  it("rejects passwords without a symbol before contacting the backend", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    expect(await registerAction({ ...fields, password: "Secret123" })).toMatchObject({
      success: false, fieldErrors: { password: ["register-password-pattern"] },
    });
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    [409, "register-error-conflict"],
    [429, "register-error-rate-limit"],
    [422, "register-error-validation"],
    [503, "register-error-unavailable"],
  ])("maps backend status %i to safe feedback", async (status, error) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private backend error", { status })));
    expect(await registerAction(fields)).toMatchObject({ success: false, error });
  });

  it("does not report success for a malformed backend response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid JSON", { status: 201 })));
    expect(await registerAction(fields)).toEqual({ success: false, error: "register-error-unavailable" });
  });
});
