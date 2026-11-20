const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { Product } = require('../src/models/Product');
const Category = require('../src/models/Category');

describe('Cart & Wishlist Endpoints & Pagination Tests', () => {
  let customerToken = '';
  let testProductId = '';
  let testVariantSku = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Register a test customer once for the suite
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Wishlist Tester',
        email: `wishlist.tester.${Date.now()}.${Math.random().toString(36).substring(7)}@example.com`,
        password: 'Password123!',
        phone: '+201099887766'
      });
    customerToken = regRes.body.data?.accessToken;

    const product = await Product.findOne({ status: 'ACTIVE' });
    if (product) {
      testProductId = product._id.toString();
      testVariantSku = product.variants?.[0]?.sku || product.sku;
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Add to Cart Routes', () => {
    it('should add item to cart via POST /api/v1/cart', async () => {
      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          variantSku: testVariantSku,
          quantity: 1
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should add item to cart via alias POST /api/v1/cart/add', async () => {
      const res = await request(app)
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          variantSku: testVariantSku,
          quantity: 1
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should add item to cart via POST /api/v1/cart/items', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          variantSku: testVariantSku,
          quantity: 1
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Wishlist Routes', () => {
    it('should add product to wishlist via POST /api/v1/wishlist', async () => {
      const res = await request(app)
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inWishlist).toBe(true);
    });

    it('should check product is in wishlist via GET /api/v1/wishlist/check/:productId', async () => {
      const res = await request(app)
        .get(`/api/v1/wishlist/check/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.inWishlist).toBe(true);
    });

    it('should retrieve paginated wishlist via GET /api/v1/wishlist', async () => {
      const res = await request(app)
        .get('/api/v1/wishlist?page=1&limit=5')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });

    it('should remove product from wishlist via DELETE /api/v1/wishlist/:productId', async () => {
      const res = await request(app)
        .delete(`/api/v1/wishlist/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify status is now false
      const checkRes = await request(app)
        .get(`/api/v1/wishlist/check/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(checkRes.body.data.inWishlist).toBe(false);
    });
  });

  describe('Pagination across Routes', () => {
    it('should support pagination on categories when query params are provided', async () => {
      const res = await request(app).get('/api/v1/categories?page=1&limit=2');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
    });

    it('should support backward-compatible unpaginated categories when no page is provided', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination on notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.unreadCount).toBeDefined();
    });
  });
});
