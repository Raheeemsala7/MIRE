import "server-only";

import { CredentialsSignin, type User } from "next-auth";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { backendLogin, BackendAuthError } from "./backend-client";
import { createSession } from "./session-store";
import { verifySignInProof } from "./sign-in-proof";
import type { SafeUser } from "./types";

class LoginUnavailable extends CredentialsSignin {
  code = "unavailable";
}

export async function authorizeCredentials(credentials: Partial<Record<string, unknown>>): Promise<User | null> {
  const parsed = loginSchema.safeParse({
    email: credentials.email,
    password: credentials.password,
    rememberMe: credentials.rememberMe === "true",
  });
  if (!parsed.success) return null;
  const { email, password, rememberMe } = parsed.data;
  // Only loginAction can apply the correct per-login browser-cookie lifetime.
  if (!verifySignInProof(credentials.proof, email, rememberMe)) return null;

  try {
    const result = await backendLogin(email, password);
    const user: SafeUser = {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      ...(result.user.permissions ? { permissions: result.user.permissions } : {}),
    };
    const sessionId = await createSession(user, result.accessToken, result.refreshToken, rememberMe);
    return { ...user, sessionId };
  } catch (error) {
    console.error("Authorize credentials error details:", error);
    if (error instanceof BackendAuthError && error.status === 401) return null;
    throw new LoginUnavailable();
  }
}
