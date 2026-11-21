import { z } from "zod";
import { BUNDLE_TYPES } from "../types/bundle.types";

export const createBundleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "bundle-error-title-min")
      .max(150, "bundle-error-title-max"),
    description: z.string().trim().optional(),
    type: z.enum(BUNDLE_TYPES, {
      error: "bundle-error-type-required",
    }),
    eligibleProducts: z.array(z.string()).optional(),
    eligibleCategories: z.array(z.string()).optional(),
    requiredQuantity: z
      .number({ error: "bundle-error-quantity-number" })
      .int("bundle-error-quantity-integer")
      .min(1, "bundle-error-quantity-min"),
    freeQuantity: z
      .number()
      .int("bundle-error-free-quantity-integer")
      .min(0, "bundle-error-free-quantity-min")
      .optional(),
    bundlePrice: z
      .number()
      .min(0, "bundle-error-price-min")
      .optional()
      .nullable(),
    discountPercentage: z
      .number()
      .min(0, "bundle-error-percent-min")
      .max(100, "bundle-error-percent-max")
      .optional()
      .nullable(),
    startDate: z.string().min(1, "bundle-error-start-date-required"),
    endDate: z.string().min(1, "bundle-error-end-date-required"),
    usageLimit: z
      .number()
      .int("bundle-error-usage-limit-integer")
      .positive("bundle-error-usage-limit-positive")
      .optional()
      .nullable(),
    maxUsesPerCustomer: z
      .number()
      .int("bundle-error-max-uses-integer")
      .positive("bundle-error-max-uses-positive")
      .optional(),
    isActive: z.boolean().optional(),
    bannerImage: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate date order
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "bundle-error-date-order",
          path: ["endDate"],
        });
      }
    }

    // Validate type-specific constraints
    if (data.type === "FIXED_PRICE" || data.type === "COLLECTION_PICK") {
      if (data.bundlePrice === undefined || data.bundlePrice === null || isNaN(data.bundlePrice)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "bundle-error-price-required",
          path: ["bundlePrice"],
        });
      }
    }

    if (data.type === "BUY_X_GET_Y") {
      if (!data.freeQuantity || data.freeQuantity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "bundle-error-free-quantity-required",
          path: ["freeQuantity"],
        });
      }
    }

    if (data.type === "PERCENTAGE") {
      if (
        data.discountPercentage === undefined ||
        data.discountPercentage === null ||
        isNaN(data.discountPercentage) ||
        data.discountPercentage <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "bundle-error-percentage-required",
          path: ["discountPercentage"],
        });
      }
    }
  });

export const updateBundleSchema = z
  .object({
    title: z.string().trim().min(2, "bundle-error-title-min").max(150, "bundle-error-title-max").optional(),
    description: z.string().trim().optional(),
    type: z.enum(BUNDLE_TYPES).optional(),
    eligibleProducts: z.array(z.string()).optional(),
    eligibleCategories: z.array(z.string()).optional(),
    requiredQuantity: z.number().int().min(1).optional(),
    freeQuantity: z.number().int().min(0).optional(),
    bundlePrice: z.number().min(0).optional().nullable(),
    discountPercentage: z.number().min(0).max(100).optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    usageLimit: z.number().int().positive().optional().nullable(),
    maxUsesPerCustomer: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    bannerImage: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "bundle-error-date-order",
          path: ["endDate"],
        });
      }
    }
  });

export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;
