"use server";

import { z } from "zod";

import {
  registerSchema,
  type RegistrationFields,
} from "@/features/auth/lib/schemes/auth.schema";
import type { RegistrationResult } from "@/features/auth/lib/types/auth";

const registrationResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.literal(201),
});

export async function registerAction(
  fields: RegistrationFields,
): Promise<RegistrationResult> {
  // Validate again at the server boundary, including callers outside the form.
  const validation = registerSchema.safeParse(fields);

  if (!validation.success) {
    return {
      success: false,
      error: "register-error-validation",
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const apiUrl = (
    process.env.API_URL || "http://localhost:5000/api/v1"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.data),
      // Registration contains credentials and must never enter a shared cache.
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 409) {
      return {
        success: false,
        error: "register-error-conflict",
        fieldErrors: { email: ["register-error-conflict"] },
      };
    }

    if (response.status === 429) {
      return { success: false, error: "register-error-rate-limit" };
    }

    if (response.status === 400 || response.status === 422) {
      return { success: false, error: "register-error-validation" };
    }

    if (!response.ok) {
      return {
        success: false,
        error:
          response.status >= 500
            ? "register-error-unavailable"
            : "register-error-unknown",
      };
    }

    const payload: unknown = await response.json().catch(() => null);

    if (!registrationResponseSchema.safeParse(payload).success) {
      return { success: false, error: "register-error-unknown" };
    }

    // The API also returns tokens. Never serialize them into a client result.
    return { success: true };
  } catch {
    return { success: false, error: "register-error-unavailable" };
  }
}
