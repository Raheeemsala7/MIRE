"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { signIn, getServerSession } from "@/auth";
import { loginSchema, type LoginFields } from "../schemas/login.schema";
import { loginDestination, normalizeLocale } from "@/lib/auth/permissions";

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
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const session = await getServerSession();
    if (!session?.user) {
      return { success: false, error: "invalid" };
    }

    const jar = await cookies();
    const locale = normalizeLocale(options?.locale ?? jar.get("NEXT_LOCALE")?.value);
    const destination = loginDestination(session.user, locale, options?.callbackUrl);

    return { success: true, destination };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "invalid" };
      }
      return { success: false, error: "unavailable" };
    }
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }
    return { success: false, error: "unavailable" };
  }
}
