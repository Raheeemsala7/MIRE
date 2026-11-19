import { z } from "zod";

export function createRegisterSchema(translate: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, translate("register-name-min"))
      .max(100, translate("register-name-max")),
    email: z.string().trim().email(translate("register-email-invalid")),
    password: z
      .string()
      .min(8, translate("register-password-min"))
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        translate("register-password-pattern"),
      ),
    phone: z
      .string()
      .trim()
      .refine(
        (phone) =>
          phone === "" ||
          (/^\+?[\d\s()-]+$/.test(phone) &&
            phone.replace(/\D/g, "").length >= 7 &&
            phone.replace(/\D/g, "").length <= 15),
        translate("register-phone-invalid"),
      )
      .optional(),
  });
}

export const registerSchema = createRegisterSchema((key) => key);

export type RegistrationFields = z.infer<typeof registerSchema>;
