"use server";

import { z } from "zod";
import { backendResetPassword, BackendAuthError } from "@/lib/auth/backend-client";
import { resetPasswordSchema, type ResetPasswordFields } from "../schemas/password.schema";
import type { ResetPasswordResult } from "../types/password.types";

export async function resetPasswordAction(fields: ResetPasswordFields): Promise<ResetPasswordResult> {
  const validation = resetPasswordSchema.safeParse(fields);
  if (!validation.success) {
    return {
      success: false,
      error: "reset-error-validation",
      fieldErrors: z.flattenError(validation.error).fieldErrors,
    };
  }

  try {
    await backendResetPassword(validation.data.token, validation.data.password);
    return { success: true };
  } catch (error) {
    if (!(error instanceof BackendAuthError)) {
      return { success: false, error: "reset-error-unavailable" };
    }
    switch (error.status) {
      case 400:
        return { success: false, error: "reset-error-invalid-token" };
      case 429:
        return { success: false, error: "reset-error-rate-limit" };
      case 422:
        return { success: false, error: "reset-error-validation" };
      default:
        return { success: false, error: "reset-error-unavailable" };
    }
  }
}
