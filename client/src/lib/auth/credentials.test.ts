import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeCredentials } from "./credentials";

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({ CredentialsSignin: class extends Error { code = "credentials"; } }));
const mocks = vi.hoisted(() => ({ login: vi.fn(), createSession: vi.fn(), proof: vi.fn() }));
vi.mock("./backend-client", () => ({
  backendLogin: mocks.login,
  BackendAuthError: class extends Error { constructor(public status: number) { super("backend failure"); } },
}));
vi.mock("./session-store", () => ({ createSession: mocks.createSession }));
vi.mock("./sign-in-proof", () => ({ verifySignInProof: mocks.proof }));

const input = { email: "hala@example.com", password: "Secret123!", rememberMe: "false", proof: "signed-proof" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.proof.mockReturnValue(true);
  mocks.createSession.mockResolvedValue("opaque-id");
  mocks.login.mockResolvedValue({
    user: { _id: "user-id", name: "Hala", email: input.email, role: "CUSTOMER" },
    accessToken: "access", refreshToken: "refresh",
  });
});

describe("Auth.js credentials provider", () => {
  it("blocks direct callbacks without a valid server proof", async () => {
    mocks.proof.mockReturnValue(false);
    expect(await authorizeCredentials(input)).toBeNull();
    expect(mocks.login).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("passes tokens only to the session store and returns a safe Auth.js user", async () => {
    expect(await authorizeCredentials(input)).toEqual({ id: "user-id", sessionId: "opaque-id", name: "Hala", email: input.email, role: "CUSTOMER" });
    expect(mocks.createSession).toHaveBeenCalledWith(
      { id: "user-id", name: "Hala", email: input.email, role: "CUSTOMER" }, "access", "refresh", false,
    );
  });

  it("returns invalid credentials for backend 401, and unavailable for storage failure", async () => {
    const { BackendAuthError } = await import("./backend-client");
    mocks.login.mockRejectedValueOnce(new BackendAuthError(401));
    expect(await authorizeCredentials(input)).toBeNull();
    mocks.createSession.mockRejectedValueOnce(new Error("private database error"));
    await expect(authorizeCredentials(input)).rejects.toMatchObject({ code: "unavailable" });
  });
});
