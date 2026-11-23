"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getNextAuthToken, clearAuthCookies } from "@/shared/lib/utils/auth.utils";
import { backendLogout } from "@/lib/auth/backend-client";
import { getAuthLocale } from "../lib/locale";

export async function logoutAction() {
  const locale = await getAuthLocale();

  try {
    const token = await getNextAuthToken();
    const rawToken =
      typeof token?.token === "string"
        ? token.token
        : typeof (token as any)?.accessToken === "string"
        ? (token as any).accessToken
        : undefined;
    if (rawToken) {
      await backendLogout(rawToken);
    }
  } catch {
    // Non-blocking: proceed with local signout even if backend is unreachable
  }

  await clearAuthCookies();
  await signOut({ redirect: false });
  redirect(`/${locale}/auth/login`);
}
