const { z } = require('zod');
const { BundleTypes } = require('../models/Bundle');

const bundleCreateSchema = z.object({
  title: z.string().min(2, 'Bundle title is required').max(150),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(Object.values(BundleTypes)),
  eligibleProducts: z.array(z.string()).default([]),
  eligibleCategories: z.array(z.string()).default([]),
  requiredQuantity: z.number().int().min(1, 'Required quantity must be at least 1'),
  freeQuantity: z.number().int().min(0).default(0),
  bundlePrice: z.number().min(0).optional().nullable(),
  discountPercentage: z.number().min(0).max(100).optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  usageLimit: z.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  bannerImage: z.string().optional()
});

const bundleUpdateSchema = bundleCreateSchema.partial();

const couponCreateSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  usageLimit: z.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.number().int().positive().default(1),
  isActive: z.boolean().default(true)
});

const couponUpdateSchema = couponCreateSchema.partial();

const applyCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0).optional().default(0)
}).passthrough();

module.exports = {
  bundleCreateSchema,
  bundleUpdateSchema,
  couponCreateSchema,
  couponUpdateSchema,
  applyCouponSchema
};
