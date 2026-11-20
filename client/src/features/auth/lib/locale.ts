import "server-only";
import { cache } from "react";
import { getLocale } from "next-intl/server";
import { normalizeLocale } from "@/lib/auth/permissions";

export const getAuthLocale = cache(async () => normalizeLocale(await getLocale()));
