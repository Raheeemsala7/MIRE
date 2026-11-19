import { z } from "zod";

export function createLoginSchema(translate: (key: string) => string) {
  return z.object({
    email: z.string().trim().email(translate("login-email-invalid")),
    // Existing passwords must not be rejected by registration's strength rules.
    password: z.string().min(1, translate("login-password-required")),
    rememberMe: z.boolean(),
  });
}

export const loginSchema = createLoginSchema((key) => key);

export type LoginFields = z.infer<typeof loginSchema>;
