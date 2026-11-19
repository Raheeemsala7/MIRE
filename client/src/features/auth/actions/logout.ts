"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendLogout } from "@/lib/auth/backend-client";
import { deleteSession } from "@/lib/auth/session-store";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { freshSession } from "@/lib/auth/refresh-token";

export async function logoutAction() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    const session = await freshSession(id).catch(() => null);
    await deleteSession(id);
    if (session) await backendLogout(session.accessToken);
  }
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
