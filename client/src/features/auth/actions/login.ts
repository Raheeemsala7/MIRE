"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { loginSchema, type LoginFields } from "../schemas/login.schema";
import { loginDestination, normalizeLocale } from "@/lib/auth/permissions";
import { backendLogin, BackendApiError } from "@/lib/auth/backend-client";
import type { SafeUser } from "@/lib/auth/types";

export type LoginResult =
  | { success: true; destination: string }
  | { success: false; error: "invalid" | "unavailable" | "validation" };

export async function loginAction(
  input: LoginFields,
  options?: { locale?: string; callbackUrl?: string }
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "validation" };

  try {
    // 1. Authenticate with backend directly to verify credentials and obtain user details
    const authData = await backendLogin(parsed.data.email, parsed.data.password);
    if (!authData?.user || !authData?.accessToken) {
      return { success: false, error: "invalid" };
    }

    // 2. Establish Auth.js session cookies
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    // 3. Compute destination directly from the authenticated user
    const jar = await cookies();
    const locale = normalizeLocale(options?.locale ?? jar.get("NEXT_LOCALE")?.value);
    const safeUser: SafeUser = {
      id: authData.user._id,
      name: authData.user.name,
      email: authData.user.email,
      role: authData.user.role,
      permissions: authData.user.permissions || [],
    };

    const destination = loginDestination(safeUser, locale, options?.callbackUrl);
    return { success: true, destination };
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 401 || error.status === 400)) {
      return { success: false, error: "invalid" };
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "invalid" };
      }
      return { success: false, error: "unavailable" };
    }
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }
    console.error("Login action error:", error);
    return { success: false, error: "invalid" };
  }
}
