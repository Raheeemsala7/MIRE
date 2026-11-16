const { z } = require('zod');
const { SIZES } = require('../models/Product');

const variantSchema = z.object({
  sku: z.string().min(1, 'Variant SKU is required'),
  color: z.string().min(1, 'Color name is required'),
  size: z.enum(SIZES),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  priceOverride: z.number().positive().optional().nullable()
});

const imageSchema = z.object({
  url: z.string().url('Valid image URL required'),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional()
});

const colorSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2), // e.g. #f43f5e
  image: z.string().optional()
});

const productCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  sku: z.string().min(2, 'Base SKU is required').toUpperCase(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category ID is required'),
  brand: z.string().default('MIRE'),
  price: z.number().positive('Price must be greater than 0'),
  discountPrice: z.number().positive().optional().nullable(),
  images: z.array(imageSchema).min(1, 'At least one image is required'),
  colors: z.array(colorSchema).default([]),
  sizes: z.array(z.enum(SIZES)).default(['S', 'M', 'L']),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  lowStockThreshold: z.number().int().min(1).default(5),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

const productUpdateSchema = productCreateSchema.partial();

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantSku: z.string().min(1, 'Variant SKU is required'),
  quantityChange: z.number().int().refine((val) => val !== 0, 'Quantity change cannot be 0'),
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE']),
  reason: z.string().min(3, 'Reason is required for manual stock adjustment')
});

module.exports = {
  productCreateSchema,
  productUpdateSchema,
  stockAdjustmentSchema
};
