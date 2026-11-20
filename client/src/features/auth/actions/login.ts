"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { handlers, signIn } from "@/auth";
import type { Session } from "next-auth";
import { loginSchema, type LoginFields } from "../schemas/login.schema";
import { deleteSession, getSession } from "@/lib/auth/session-store";
import { SESSION_COOKIE } from "@/lib/auth/policy";
import { loginDestination, normalizeLocale } from "@/lib/auth/permissions";
import { issueSignInProof } from "@/lib/auth/sign-in-proof";
import { sessionCookieOptions } from "@/lib/auth/policy";

export type LoginResult = { success: true; destination: string } |
  { success: false; error: "invalid" | "unavailable" | "validation" };

export async function loginAction(input: LoginFields, options?: { locale?: string; callbackUrl?: string }): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "validation" };
  const jar = await cookies();
  const oldId = jar.get(SESSION_COOKIE)?.value;
  try {
    await signIn("credentials", {
      email: parsed.data.email, password: parsed.data.password,
      rememberMe: String(parsed.data.rememberMe), redirect: false,
      proof: issueSignInProof(parsed.data.email, parsed.data.rememberMe),
    });
    const id = jar.get(SESSION_COOKIE)?.value;
    if (!id) return { success: false, error: "unavailable" };
    const session = await getSession(id);
    if (!session) return { success: false, error: "unavailable" };
    // auth() reads the incoming request headers. Resolve the newly issued cookie
    // through Auth.js before this action's Set-Cookie has reached the browser.
    const response = await handlers.GET(new NextRequest("http://localhost/api/auth/session", {
      headers: { cookie: `${SESSION_COOKIE}=${id}` },
    }));
    const identity: Session | null = response.ok ? await response.json() : null;
    if (!identity?.user) {
      await deleteSession(id);
      jar.delete(SESSION_COOKIE);
      return { success: false, error: "unavailable" };
    }
    if (oldId && oldId !== id) await deleteSession(oldId);
    jar.set(SESSION_COOKIE, id, sessionCookieOptions(parsed.data.rememberMe, process.env.NODE_ENV === "production"));
    const locale = normalizeLocale(options?.locale ?? jar.get("NEXT_LOCALE")?.value);
    return { success: true, destination: loginDestination(identity.user, locale, options?.callbackUrl) };
  } catch (error) {
    const newId = jar.get(SESSION_COOKIE)?.value;
    if (newId && newId !== oldId) {
      await deleteSession(newId);
      jar.delete(SESSION_COOKIE);
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "code" in error && error.code === "unavailable" ? "unavailable" : "invalid" };
      }
      return { success: false, error: "unavailable" };
    }
    return { success: false, error: "unavailable" };
  }
}
