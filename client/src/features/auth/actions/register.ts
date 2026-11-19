"use server";

import { z } from "zod";
import { backendRegister, BackendAuthError } from "@/lib/auth/backend-client";
import { registerSchema, type RegistrationFields } from "../schemas/register.schema";
import type { RegistrationResult } from "../types/register";

export async function registerAction(fields: RegistrationFields): Promise<RegistrationResult> {
  const validation = registerSchema.safeParse(fields);
  if (!validation.success) {
    return {
      success: false,
      error: "register-error-validation",
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  try {
    await backendRegister(validation.data);
    return { success: true };
  } catch (error) {
    if (!(error instanceof BackendAuthError)) {
      return { success: false, error: "register-error-unavailable" };
    }
    switch (error.status) {
      case 409:
        return { success: false, error: "register-error-conflict", fieldErrors: { email: ["register-error-conflict"] } };
      case 429:
        return { success: false, error: "register-error-rate-limit" };
      case 400:
      case 422:
        return { success: false, error: "register-error-validation" };
      default:
        return { success: false, error: error.status >= 500 ? "register-error-unavailable" : "register-error-unknown" };
    }
  }
}
