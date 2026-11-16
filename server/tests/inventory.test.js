const mongoose = require('mongoose');
const env = require('../src/config/env');
const { Product } = require('../src/models/Product');
const inventoryService = require('../src/services/inventory.service');

describe('Inventory Consistency & Atomic Updates Tests', () => {
  let testProduct;
  const testSku = `TEST-SKU-${Date.now()}`;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    testProduct = await Product.create({
      name: 'Inventory Test Dress',
      slug: `inventory-test-dress-${Date.now()}`,
      sku: `BASE-${Date.now()}`,
      description: 'Test product for inventory assertions',
      category: new mongoose.Types.ObjectId(),
      price: 1000,
      images: [{ url: 'https://example.com/dress.jpg' }],
      variants: [
        {
          sku: testSku,
          color: 'Blush',
          size: 'M',
          stockQuantity: 10
        }
      ]
    });
  });

  afterAll(async () => {
    if (testProduct) {
      await Product.findByIdAndDelete(testProduct._id);
    }
    await mongoose.connection.close();
  });

  it('should atomically deduct inventory stock and record movement', async () => {
    const { product, movement } = await inventoryService.adjustStock({
      productId: testProduct._id,
      variantSku: testSku,
      quantityChange: -4,
      type: 'SALE',
      reason: 'Unit test reservation'
    });

    const updatedVariant = product.variants.find((v) => v.sku === testSku);
    expect(updatedVariant.stockQuantity).toBe(6);
    expect(movement.previousStock).toBe(10);
    expect(movement.newStock).toBe(6);
    expect(movement.quantityChange).toBe(-4);
  });

  it('should prevent overselling when requested quantity exceeds available stock', async () => {
    // Current stock is 6, attempting to deduct 10 must fail
    await expect(
      inventoryService.adjustStock({
        productId: testProduct._id,
        variantSku: testSku,
        quantityChange: -10,
        type: 'SALE',
        reason: 'Oversell test'
      })
    ).rejects.toThrow(/Insufficient stock/);

    // Verify stock remains intact at 6
    const freshProduct = await Product.findById(testProduct._id);
    const variant = freshProduct.variants.find((v) => v.sku === testSku);
    expect(variant.stockQuantity).toBe(6);
  });
});
