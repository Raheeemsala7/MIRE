import "server-only";
import { z } from "zod";
import type { RegistrationFields } from "@/features/auth/schemas/register.schema";

const role = z.enum(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT", "INVENTORY_MANAGER", "ACCOUNTANT", "CUSTOMER"]);
const user = z.object({
  _id: z.string(), name: z.string(), email: z.email(), role,
});
const loginPayload = z.object({
  success: z.literal(true),
  data: z.object({ user, accessToken: z.string().min(1), refreshToken: z.string().min(1) }),
});
const refreshPayload = z.object({
  success: z.literal(true),
  data: z.object({ accessToken: z.string().min(1), refreshToken: z.string().min(1) }),
});
const registrationPayload = z.object({ success: z.literal(true), statusCode: z.literal(201) });

export class BackendAuthError extends Error {
  constructor(public readonly status: number) { super("Backend authentication failed"); }
}

function apiUrl() {
  const value = process.env.BACKEND_API_URL || process.env.API_URL || "http://localhost:5000/api/v1";
  const base = value.replace(/\/+$/, "");
  return new URL(base).pathname === "/" ? `${base}/api/v1` : base;
}

async function post(path: string, body: object, accessToken?: string) {
  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      method: "POST", headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
  } catch { throw new BackendAuthError(503); }
  if (!response.ok) throw new BackendAuthError(response.status);
  try {
    return await response.json() as unknown;
  } catch {
    throw new BackendAuthError(502);
  }
}

export async function backendRegister(fields: RegistrationFields): Promise<void> {
  const parsed = registrationPayload.safeParse(await post("/auth/register", fields));
  if (!parsed.success) throw new BackendAuthError(502);
  // Registration also returns tokens; deliberately discard them at this boundary.
}

export async function backendLogin(email: string, password: string) {
  const parsed = loginPayload.safeParse(await post("/auth/login", { email, password }));
  if (!parsed.success) throw new BackendAuthError(502);
  return parsed.data.data;
}

export async function backendRefresh(refreshToken: string) {
  const parsed = refreshPayload.safeParse(await post("/auth/refresh-token", { refreshToken }));
  if (!parsed.success) throw new BackendAuthError(502);
  return parsed.data.data;
}

export async function backendLogout(accessToken: string) {
  try { await post("/auth/logout", {}, accessToken); } catch { /* local revocation still proceeds */ }
}

export async function backendGet<T>(path: `/${string}`, accessToken: string): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new BackendAuthError(response.status);
  return response.json() as Promise<T>;
}
