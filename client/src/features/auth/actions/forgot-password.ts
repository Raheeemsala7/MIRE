"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { backendForgotPassword, BackendAuthError } from "@/lib/auth/backend-client";
import { forgotPasswordSchema, type ForgotPasswordFields } from "../schemas/password.schema";
import type { ForgotPasswordResult } from "../types/password.types";

const FORGOT_COOLDOWN_COOKIE = "mire_forgot_cooldown";
const COOLDOWN_SECONDS = 60;

export async function forgotPasswordAction(fields: ForgotPasswordFields): Promise<ForgotPasswordResult> {
  const validation = forgotPasswordSchema.safeParse(fields);
  if (!validation.success) {
    return {
      success: false,
      error: "forgot-error-validation",
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  let jar: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    jar = await cookies();
  } catch {
    // Graceful fallback when invoked outside Next.js request context (e.g. isolated test environments)
  }

  if (jar) {
    const cooldownValue = jar.get(FORGOT_COOLDOWN_COOKIE)?.value;
    if (cooldownValue) {
      const expiry = Number(cooldownValue);
      if (!Number.isNaN(expiry) && expiry > Date.now()) {
        return {
          success: false,
          error: "forgot-error-rate-limit",
        };
      }
    }
  }

  try {
    await backendForgotPassword(validation.data.email.toLowerCase().trim());

    if (jar) {
      const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
      jar.set(FORGOT_COOLDOWN_COOKIE, String(expiry), {
        maxAge: COOLDOWN_SECONDS,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return { success: true };
  } catch (error) {
    if (!(error instanceof BackendAuthError)) {
      return { success: false, error: "forgot-error-unavailable" };
    }
    switch (error.status) {
      case 429:
        return { success: false, error: "forgot-error-rate-limit" };
      case 400:
      case 422:
        return { success: false, error: "forgot-error-validation" };
      default:
        return { success: false, error: "forgot-error-unavailable" };
    }
  }
}
