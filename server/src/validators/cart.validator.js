const { z } = require('zod');

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantSku: z.string().min(1, 'Variant SKU is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

const applyCouponCartSchema = z.object({
  couponCode: z.string().min(1, 'Coupon code is required')
});

const applyBundleCartSchema = z.object({
  bundleId: z.string().min(1, 'Bundle ID is required')
});

const setGovernorateSchema = z.object({
  governorate: z.string().min(2, 'Governorate is required')
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponCartSchema,
  applyBundleCartSchema,
  setGovernorateSchema
};
