import { z } from "zod";

export function createForgotPasswordSchema(translate: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .trim()
      .email(translate("forgot-email-invalid")),
  });
}

export const forgotPasswordSchema = createForgotPasswordSchema((key) => key);

export type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export function createResetPasswordSchema(translate: (key: string) => string) {
  return z
    .object({
      token: z.string().min(1, translate("reset-error-invalid-token")),
      password: z
        .string()
        .min(8, translate("reset-password-min"))
        .regex(
          /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
          translate("reset-password-pattern"),
        ),
      confirmPassword: z.string().min(1, translate("reset-confirm-required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: translate("reset-password-mismatch"),
      path: ["confirmPassword"],
    });
}

export const resetPasswordSchema = createResetPasswordSchema((key) => key);

export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;
