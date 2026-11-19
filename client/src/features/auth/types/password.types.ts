import type { ForgotPasswordFields, ResetPasswordFields } from "../schemas/password.schema";

export type ForgotPasswordErrorKey =
  | "forgot-error-rate-limit"
  | "forgot-error-unavailable"
  | "forgot-error-validation";

export type ForgotPasswordFieldErrors = Partial<
  Record<keyof ForgotPasswordFields, string[]>
>;

export type ForgotPasswordResult =
  | { success: true }
  | {
      success: false;
      error: ForgotPasswordErrorKey;
      fieldErrors?: ForgotPasswordFieldErrors;
    };

export type ResetPasswordErrorKey =
  | "reset-error-invalid-token"
  | "reset-error-rate-limit"
  | "reset-error-validation"
  | "reset-error-unavailable";

export type ResetPasswordFieldErrors = Partial<
  Record<keyof ResetPasswordFields, string[]>
>;

export type ResetPasswordResult =
  | { success: true }
  | {
      success: false;
      error: ResetPasswordErrorKey;
      fieldErrors?: ResetPasswordFieldErrors;
    };
