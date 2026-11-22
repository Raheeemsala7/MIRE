import { z } from "zod";

/**
 * Image sub-schema matching backend contract { url: string, publicId?: string }
 */
export const categoryImageSchema = z.object({
  url: z
    .string()
    .trim()
    .url("category-image-url-error")
    .or(z.literal("")),
  publicId: z.string().optional(),
});

/**
 * Validation schema for Category create / update forms
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "category-name-min-error")
    .max(100, "category-name-max-error"),
  slug: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(500, "category-desc-max-error")
    .optional(),
  image: categoryImageSchema.optional(),
  parentCategory: z.string().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z
    .number()
    .int("category-sort-order-integer-error")
    .min(0, "category-sort-order-min-error"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
