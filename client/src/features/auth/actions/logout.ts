"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getAuthLocale } from "../lib/locale";

export async function logoutAction() {
  const locale = await getAuthLocale();
  await signOut({ redirect: false });
  redirect(`/${locale}/auth/login`);
}
