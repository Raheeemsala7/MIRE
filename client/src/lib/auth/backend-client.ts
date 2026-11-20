import "server-only";
import { z } from "zod";
import type { RegistrationFields } from "@/features/auth/schemas/register.schema";

const role = z.enum(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT", "INVENTORY_MANAGER", "ACCOUNTANT", "CUSTOMER"]);
const user = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.email(),
  role,
  permissions: z.array(z.string()).optional(),
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
const forgotPasswordPayload = z.object({ success: z.literal(true) });
const resetPasswordPayload = z.object({ success: z.literal(true) });

export class BackendAuthError extends Error {
  constructor(public readonly status: number) { super("Backend authentication failed"); }
}

export class BackendApiError extends Error {
  public readonly messageText?: string;
  public readonly errors?: Array<{ field?: string; message?: string }>;

  constructor(public readonly status: number, public readonly data?: unknown) {
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : `Backend request failed with status ${status}`;
    super(msg);
    this.messageText = msg;
    if (
      typeof data === "object" &&
      data !== null &&
      "errors" in data &&
      Array.isArray((data as { errors: unknown }).errors)
    ) {
      this.errors = (data as { errors: Array<{ field?: string; message?: string }> }).errors;
    }
  }
}

function apiUrl(): string {
  const value = process.env.BACKEND_API_URL || process.env.API_URL;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing BACKEND_API_URL or API_URL environment variable in production.");
    }
    return "http://localhost:5000/api/v1";
  }
  const base = value.replace(/\/+$/, "");
  try {
    return new URL(base).pathname === "/" ? `${base}/api/v1` : base;
  } catch {
    return base;
  }
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

export async function backendForgotPassword(email: string): Promise<void> {
  const parsed = forgotPasswordPayload.safeParse(await post("/auth/forgot-password", { email }));
  if (!parsed.success) throw new BackendAuthError(502);
}

export async function backendResetPassword(token: string, password: string): Promise<void> {
  const parsed = resetPasswordPayload.safeParse(await post("/auth/reset-password", { token, password }));
  if (!parsed.success) throw new BackendAuthError(502);
}

export async function backendGet<T>(path: `/${string}`, accessToken: string): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    let errorData: unknown;
    try { errorData = await response.json(); } catch { /* ignore */ }
    throw new BackendApiError(response.status, errorData);
  }
  return response.json() as Promise<T>;
}

export async function backendMe(accessToken: string) {
  const payload = await backendGet<unknown>("/auth/me", accessToken);
  const parsed = z.object({ success: z.literal(true), data: z.object({ user }) }).safeParse(payload);
  if (!parsed.success) throw new BackendAuthError(502);
  const { _id, name, email, role, permissions } = parsed.data.data.user;
  return { id: _id, name, email, role, ...(permissions ? { permissions } : {}) };
}

export async function backendPost<T>(path: `/${string}`, body: unknown, accessToken: string): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    let errorData: unknown;
    try { errorData = await response.json(); } catch { /* ignore */ }
    throw new BackendApiError(response.status, errorData);
  }
  return response.json() as Promise<T>;
}

export async function backendPatch<T>(path: `/${string}`, body: unknown, accessToken: string): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    let errorData: unknown;
    try { errorData = await response.json(); } catch { /* ignore */ }
    throw new BackendApiError(response.status, errorData);
  }
  return response.json() as Promise<T>;
}
