import { z } from "zod";

export const stockAdjustmentTypeEnum = z.enum([
  "PURCHASE",
  "SALE",
  "RETURN",
  "ADJUSTMENT",
  "DAMAGE",
]);

export const adjustStockSchema = z.object({
  productId: z.string().min(1, "inventory-adjust-product-required"),
  variantSku: z.string().min(1, "inventory-adjust-variant-required"),
  quantityChange: z
    .number()
    .int("inventory-adjust-zero-change")
    .refine((val) => val !== 0, {
      message: "inventory-adjust-zero-change",
    }),
  type: stockAdjustmentTypeEnum,
  reason: z
    .string()
    .min(3, "inventory-adjust-reason-min")
    .max(500, "Reason is too long"),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
