"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { loginSchema, type LoginFields } from "../schemas/login.schema";
import { deleteSession, getSession } from "@/lib/auth/session-store";
import { destination, SESSION_COOKIE } from "@/lib/auth/session";
import { issueSignInProof } from "@/lib/auth/sign-in-proof";
import { sessionCookieOptions } from "@/lib/auth/policy";

export type LoginResult = { success: true; destination: string } |
  { success: false; error: "invalid" | "unavailable" | "validation" };

export async function loginAction(input: LoginFields): Promise<LoginResult> {
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
    if (oldId && oldId !== id) await deleteSession(oldId);
    jar.set(SESSION_COOKIE, id, sessionCookieOptions(parsed.data.rememberMe, process.env.NODE_ENV === "production"));
    const locale = jar.get("NEXT_LOCALE")?.value || "ar";
    return { success: true, destination: destination(session.user.role, locale) };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "code" in error && error.code === "unavailable" ? "unavailable" : "invalid" };
      }
      return { success: false, error: "unavailable" };
    }
    return { success: false, error: "unavailable" };
  }
}
