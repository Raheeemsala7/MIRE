import { z } from "zod";

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "كود الكوبون يجب أن يكون 3 أحرف على الأقل")
    .max(30, "كود الكوبون طويل جداً")
    .toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  discountValue: z.coerce.number().min(0, "قيمة الخصم يجب أن تكون صفر أو أكثر"),
  minOrderAmount: z.coerce.number().min(0).optional().default(0),
  maxDiscountAmount: z.coerce.number().min(0).nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().min(1, "تاريخ الانتهاء مطلوب"),
  usageLimit: z.coerce.number().min(1).nullable().optional(),
  perUserLimit: z.coerce.number().min(1).optional().default(1),
  description: z.string().optional(),
});

export type CouponFormType = z.infer<typeof couponSchema>;
