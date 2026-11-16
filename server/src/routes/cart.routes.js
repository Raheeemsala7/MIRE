const express = require('express');
const cartController = require('../controllers/cart.controller');
const { optionalAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponCartSchema,
  applyBundleCartSchema,
  setGovernorateSchema
} = require('../validators/cart.validator');

const router = express.Router();

router.use(optionalAuth);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Retrieve current cart for customer or guest
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cart details with calculated discounts
 */
router.get('/', cartController.getCart.bind(cartController));

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add item to cart with variant validation
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, variantSku, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantSku: { type: string }
 *               quantity: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.post('/items', validate({ body: addToCartSchema }), cartController.addItem.bind(cartController));

/**
 * @swagger
 * /cart/items/{itemId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.patch('/items/:itemId', validate({ body: updateCartItemSchema }), cartController.updateItem.bind(cartController));

/**
 * @swagger
 * /cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/items/:itemId', cartController.removeItem.bind(cartController));

/**
 * @swagger
 * /cart/bundle:
 *   post:
 *     summary: Apply bundle offer to cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Bundle applied
 */
router.post('/bundle', validate({ body: applyBundleCartSchema }), cartController.applyBundle.bind(cartController));

/**
 * @swagger
 * /cart/coupon:
 *   post:
 *     summary: Apply coupon code to cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Coupon applied
 */
router.post('/coupon', validate({ body: applyCouponCartSchema }), cartController.applyCoupon.bind(cartController));

/**
 * @swagger
 * /cart/coupon:
 *   delete:
 *     summary: Remove applied coupon
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Coupon removed
 */
router.delete('/coupon', cartController.removeCoupon.bind(cartController));

/**
 * @swagger
 * /cart/governorate:
 *   post:
 *     summary: Set delivery governorate to calculate shipping fee
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Shipping calculated
 */
router.post('/governorate', validate({ body: setGovernorateSchema }), cartController.setGovernorate.bind(cartController));

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear all items in cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/clear', cartController.clearCart.bind(cartController));

module.exports = router;
