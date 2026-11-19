import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// /login has no locale segment; use the storefront's language preference.
export const getAuthLocale = cache(async () => {
  await connection();
  const locale = (await cookies()).get("NEXT_LOCALE")?.value;
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
});
