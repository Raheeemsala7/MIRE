import { describe, expect, it } from "vitest";
import {
  createForgotPasswordSchema,
  createResetPasswordSchema,
} from "./password.schema";

const t = (k: string) => k;

describe("password schema validation", () => {
  const forgotSchema = createForgotPasswordSchema(t);
  const resetSchema = createResetPasswordSchema(t);

  describe("forgot password schema", () => {
    it("accepts valid email address", () => {
      const res = forgotSchema.safeParse({ email: "user@example.com" });
      expect(res.success).toBe(true);
    });

    it("rejects invalid email address", () => {
      const res = forgotSchema.safeParse({ email: "invalid-email" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("forgot-email-invalid");
      }
    });

    it("rejects empty email address", () => {
      const res = forgotSchema.safeParse({ email: "" });
      expect(res.success).toBe(false);
    });
  });

  describe("reset password schema", () => {
    const validReset = {
      token: "valid-token-string",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    };

    it("accepts strong matching passwords with valid token", () => {
      const res = resetSchema.safeParse(validReset);
      expect(res.success).toBe(true);
    });

    it("rejects missing token", () => {
      const res = resetSchema.safeParse({ ...validReset, token: "" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("reset-error-invalid-token");
      }
    });

    it("rejects password with fewer than 8 characters", () => {
      const res = resetSchema.safeParse({
        ...validReset,
        password: "Sh1!",
        confirmPassword: "Sh1!",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("reset-password-min");
      }
    });

    it("rejects password missing uppercase letter", () => {
      const res = resetSchema.safeParse({
        ...validReset,
        password: "lowercase123!",
        confirmPassword: "lowercase123!",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("reset-password-pattern");
      }
    });

    it("rejects password missing number", () => {
      const res = resetSchema.safeParse({
        ...validReset,
        password: "NoNumberPassword!",
        confirmPassword: "NoNumberPassword!",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("reset-password-pattern");
      }
    });

    it("rejects password missing special symbol", () => {
      const res = resetSchema.safeParse({
        ...validReset,
        password: "NoSymbolPassword123",
        confirmPassword: "NoSymbolPassword123",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("reset-password-pattern");
      }
    });

    it("rejects mismatched confirmPassword", () => {
      const res = resetSchema.safeParse({
        ...validReset,
        confirmPassword: "DifferentPassword123!",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("reset-password-mismatch");
      }
    });
  });
});
