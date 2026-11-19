import type { RegistrationFields } from "../schemas/register.schema";

export type RegistrationErrorKey =
  | "register-error-validation"
  | "register-error-conflict"
  | "register-error-rate-limit"
  | "register-error-unavailable"
  | "register-error-unknown";

export type RegistrationFieldErrors = Partial<
  Record<keyof RegistrationFields, string[]>
>;

export type RegistrationResult =
  | { success: true }
  | {
      success: false;
      error: RegistrationErrorKey;
      fieldErrors?: RegistrationFieldErrors;
    };
