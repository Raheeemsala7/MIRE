const mongoose = require('mongoose');
const env = require('../src/config/env');
const promotionService = require('../src/services/promotion.service');
const { Bundle, BundleTypes } = require('../src/models/Bundle');
const Coupon = require('../src/models/Coupon');

describe('Bundles & Promotions Engine Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should accurately calculate fixed-price bundle discounts', async () => {
    const dummyProduct1 = new mongoose.Types.ObjectId();
    const dummyProduct2 = new mongoose.Types.ObjectId();

    const bundle = await Bundle.create({
      title: 'Test Fixed Bundle',
      slug: `test-fixed-${Date.now()}`,
      type: BundleTypes.FIXED_PRICE,
      eligibleProducts: [dummyProduct1, dummyProduct2],
      requiredQuantity: 2,
      bundlePrice: 599, // 2 items for 599
      startDate: new Date('2025-01-01'),
      endDate: new Date('2028-01-01'),
      isActive: true
    });

    // 2 items at 450 each = 900. Bundle price = 599. Discount should be 301.
    const cartItems = [
      { product: dummyProduct1, quantity: 1, unitPrice: 450 },
      { product: dummyProduct2, quantity: 1, unitPrice: 450 }
    ];

    const result = await promotionService.evaluateBundleDiscount(bundle._id, cartItems);
    expect(result.discount).toBe(301);
    expect(result.appliedBundle).toBeDefined();

    await Bundle.findByIdAndDelete(bundle._id);
  });

  it('should accurately calculate Buy X Get Y (BOGO) discounts', async () => {
    const dummyProduct = new mongoose.Types.ObjectId();

    const bundle = await Bundle.create({
      title: 'Test Buy 2 Get 1 Free',
      slug: `test-bogo-${Date.now()}`,
      type: BundleTypes.BUY_X_GET_Y,
      eligibleProducts: [dummyProduct],
      requiredQuantity: 2,
      freeQuantity: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2028-01-01'),
      isActive: true
    });

    // 3 items at 200 each. 1 should be free -> discount = 200.
    const cartItems = [{ product: dummyProduct, quantity: 3, unitPrice: 200 }];

    const result = await promotionService.evaluateBundleDiscount(bundle._id, cartItems);
    expect(result.discount).toBe(200);

    await Bundle.findByIdAndDelete(bundle._id);
  });

  it('should validate coupons and enforce minOrderAmount', async () => {
    const coupon = await Coupon.create({
      code: `TEST${Date.now().toString().slice(-5)}`,
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 1000,
      maxDiscountAmount: 300,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2028-01-01'),
      isActive: true
    });

    // Subtotal 800 is below 1000 minOrderAmount -> expect rejection
    await expect(
      promotionService.evaluateCouponDiscount(coupon.code, 800)
    ).rejects.toThrow(/must be at least 1000/);

    // Subtotal 1200 -> 15% is 180
    const validResult = await promotionService.evaluateCouponDiscount(coupon.code, 1200);
    expect(validResult.discount).toBe(180);

    await Coupon.findByIdAndDelete(coupon._id);
  });
});
