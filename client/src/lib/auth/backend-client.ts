import "server-only";
import type { RegistrationFields } from "@/features/auth/schemas/register.schema";

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

export class BackendAuthError extends BackendApiError {
  constructor(status: number, data?: unknown) {
    super(status, data);
    this.name = "BackendAuthError";
  }
}

export function apiUrl(): string {
  const value = process.env.BACKEND_API_URL || process.env.API_URL;
  if (!value || (process.env.NODE_ENV === "production" && value.includes("localhost"))) {
    return "https://mire-fqdw.vercel.app/api/v1";
  }
  const base = value.replace(/\/+$/, "");
  try {
    return new URL(base).pathname === "/" ? `${base}/api/v1` : base;
  } catch {
    return base;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  accessToken?: string;
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, accessToken, timeoutMs = 15_000 } = options;
  const url = `${apiUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new BackendApiError(503, { message: "Backend service unavailable" });
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      // ignore non-JSON error bodies
    }
    throw new BackendApiError(response.status, errorData);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new BackendApiError(502, { message: "Invalid JSON response from backend" });
  }
}

// -------------------------------------------------------------
// Generic Backend API Callers
// -------------------------------------------------------------

export async function backendGet<T>(path: `/${string}`, accessToken: string): Promise<T> {
  return request<T>(path, { method: "GET", accessToken });
}

export async function backendPost<T>(path: `/${string}`, body: unknown, accessToken?: string): Promise<T> {
  return request<T>(path, { method: "POST", body, accessToken });
}

export async function backendPatch<T>(path: `/${string}`, body: unknown, accessToken: string): Promise<T> {
  return request<T>(path, { method: "PATCH", body, accessToken });
}

export async function backendDelete<T>(path: `/${string}`, accessToken: string): Promise<T> {
  return request<T>(path, { method: "DELETE", accessToken });
}

// -------------------------------------------------------------
// Auth Endpoints
// -------------------------------------------------------------

export async function backendLogin(email: string, password: string) {
  try {
    const res = await request<{
      success?: boolean;
      data?: {
        user: { _id?: string; id?: string; name: string; email: string; role: any; permissions?: string[] };
        accessToken: string;
        refreshToken: string;
      };
      user?: any;
      accessToken?: string;
      refreshToken?: string;
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const user = res.data?.user || res.user;
    const accessToken = res.data?.accessToken || res.accessToken;
    const refreshToken = res.data?.refreshToken || res.refreshToken || "";

    if (!user || !accessToken) {
      throw new BackendAuthError(502, { message: "Malformed login response from backend" });
    }

    return {
      user: {
        _id: String(user._id || user.id),
        name: String(user.name || ""),
        email: String(user.email || email),
        role: user.role,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      },
      accessToken: String(accessToken),
      refreshToken: String(refreshToken),
    };
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new BackendAuthError(error.status, error.data);
    }
    throw new BackendAuthError(500);
  }
}

export async function backendRegister(fields: RegistrationFields): Promise<void> {
  try {
    await request("/auth/register", { method: "POST", body: fields });
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new BackendAuthError(error.status, error.data);
    }
    throw new BackendAuthError(500);
  }
}

export async function backendForgotPassword(email: string): Promise<void> {
  try {
    await request("/auth/forgot-password", { method: "POST", body: { email } });
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new BackendAuthError(error.status, error.data);
    }
    throw new BackendAuthError(500);
  }
}

export async function backendResetPassword(token: string, password: string): Promise<void> {
  try {
    await request("/auth/reset-password", { method: "POST", body: { token, password } });
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new BackendAuthError(error.status, error.data);
    }
    throw new BackendAuthError(500);
  }
}

export async function backendMe(accessToken: string) {
  const res = await backendGet<any>("/auth/me", accessToken);
  const user = res?.data?.user || res?.user || res;
  return {
    id: String(user._id || user.id),
    name: String(user.name || ""),
    email: String(user.email || ""),
    role: user.role,
    ...(user.permissions ? { permissions: user.permissions } : {}),
  };
}

export async function backendRefresh(refreshToken: string) {
  try {
    const res = await request<any>("/auth/refresh-token", {
      method: "POST",
      body: { refreshToken },
    });
    const data = res?.data || res;
    return {
      accessToken: String(data.accessToken),
      refreshToken: String(data.refreshToken || refreshToken),
    };
  } catch (error) {
    if (error instanceof BackendApiError) {
      throw new BackendAuthError(error.status, error.data);
    }
    throw new BackendAuthError(500);
  }
}

export async function backendLogout(accessToken: string) {
  try {
    await request("/auth/logout", { method: "POST", accessToken });
  } catch {
    // local revocation proceeds regardless
  }
}
