import { z } from "zod";

export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;

// Maximum image size in bytes (2MB)
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_IMAGE_SIZE_MB = 2;
export const MAX_PRODUCT_IMAGES = 8;

export const productImageSchema = z.object({
  url: z
    .string()
    .url("Valid image URL required")
    .refine(
      (val) => {
        if (val.startsWith("data:")) {
          const base64Data = val.split(",")[1] || "";
          const approxBytes = Math.ceil((base64Data.length * 3) / 4);
          return approxBytes <= MAX_IMAGE_SIZE_BYTES;
        }
        return true;
      },
      {
        message: `Image size must not exceed ${MAX_IMAGE_SIZE_MB}MB`,
      }
    ),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional(),
  size: z
    .number()
    .max(MAX_IMAGE_SIZE_BYTES, `Image size must not exceed ${MAX_IMAGE_SIZE_MB}MB`)
    .optional(),
});

export const productColorSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  code: z.string().min(2, "Color hex code is required"),
  image: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val && val.startsWith("data:")) {
          const base64Data = val.split(",")[1] || "";
          const approxBytes = Math.ceil((base64Data.length * 3) / 4);
          return approxBytes <= MAX_IMAGE_SIZE_BYTES;
        }
        return true;
      },
      {
        message: `Color swatch image size must not exceed ${MAX_IMAGE_SIZE_MB}MB`,
      }
    ),
});

export const productVariantSchema = z.object({
  sku: z.string().min(1, "Variant SKU is required"),
  color: z.string().min(1, "Color name is required"),
  size: z.enum(PRODUCT_SIZES, {
    message: "Invalid size",
  }),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  priceOverride: z
    .number()
    .positive("Price override must be positive")
    .optional()
    .nullable(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name cannot exceed 200 characters"),
  sku: z.string().min(2, "Base SKU must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  price: z.number().positive("Price must be greater than 0"),
  discountPrice: z
    .number()
    .positive("Discount price must be greater than 0")
    .optional()
    .nullable(),
  images: z
    .array(productImageSchema)
    .min(1, "At least one product image is required")
    .max(MAX_PRODUCT_IMAGES, `Maximum ${MAX_PRODUCT_IMAGES} images allowed`),
  colors: z.array(productColorSchema),
  sizes: z.array(z.enum(PRODUCT_SIZES)),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
  lowStockThreshold: z.number().int().min(1, "Low stock threshold must be at least 1"),
  status: z.enum(PRODUCT_STATUSES),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  tags: z.array(z.string()),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductColorInput = z.infer<typeof productColorSchema>;
