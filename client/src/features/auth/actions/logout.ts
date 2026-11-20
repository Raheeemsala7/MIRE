"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { SESSION_COOKIE } from "@/lib/auth/policy";
import { revokeBackendSession } from "@/lib/auth/backend-session";
import { getAuthLocale } from "../lib/locale";

export async function logoutAction() {
  const locale = await getAuthLocale();
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  // Revoke first even if the Auth.js JWT/session is no longer valid.
  if (id) await revokeBackendSession(id);
  await signOut({ redirect: false });
  jar.delete(SESSION_COOKIE);
  redirect(`/${locale}/auth/login`);
}
