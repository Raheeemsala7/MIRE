import { beforeEach, expect, it, vi } from "vitest";
import { preserveSessionCookiePolicy } from "./handler-cookies";
vi.mock("server-only", () => ({}));
const getSession = vi.hoisted(() => vi.fn());
vi.mock("./session-store", () => ({ getSession }));
beforeEach(() => vi.clearAllMocks());

it("does not persist an unchecked Remember Me cookie on session polling", async () => {
  getSession.mockResolvedValue({ rememberMe: false });
  const response = new Response(null, { headers: { "set-cookie": "mire_session=abc; Path=/; HttpOnly; Expires=Fri, 01 Jan 2027 00:00:00 GMT; Max-Age=2592000; SameSite=Lax" } });
  await preserveSessionCookiePolicy(response);
  expect(response.headers.get("set-cookie")).not.toMatch(/Expires|Max-Age/);
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
});
it("caps remembered cookies at the original server deadline", async () => {
  const expiresAt = new Date("2026-12-01T00:00:00Z");
  getSession.mockResolvedValue({ rememberMe: true, expiresAt });
  const response = new Response(null, { headers: { "set-cookie": "mire_session=abc; Path=/; Expires=Fri, 01 Jan 2027 00:00:00 GMT" } });
  await preserveSessionCookiePolicy(response);
  expect(response.headers.get("set-cookie")).toContain(expiresAt.toUTCString());
});
it("preserves cookie deletion and other Auth.js cookies", async () => {
  const response = new Response(null);
  response.headers.append("set-cookie", "mire_session=; Max-Age=0; Path=/");
  response.headers.append("set-cookie", "authjs.csrf-token=csrf; HttpOnly");
  const original = response.headers.getSetCookie();
  await preserveSessionCookiePolicy(response);
  expect(response.headers.getSetCookie()).toEqual(original);
  expect(getSession).not.toHaveBeenCalled();
});
