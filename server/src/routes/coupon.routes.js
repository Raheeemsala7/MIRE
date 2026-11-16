const express = require('express');
const couponController = require('../controllers/coupon.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  couponCreateSchema,
  couponUpdateSchema,
  applyCouponSchema
} = require('../validators/promotion.validator');

const router = express.Router();

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate a coupon code against current subtotal
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "WELCOME10" }
 *               subtotal: { type: number, example: 1000 }
 *     responses:
 *       200:
 *         description: Validation result with calculated discount
 */
router.post('/validate', optionalAuth, validate({ body: applyCouponSchema }), couponController.validateCoupon);

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: List all coupons (Admin)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated coupons
 */
router.get('/', authenticate, requirePermission('coupons:read'), couponController.getAll);

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create new discount coupon
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post(
  '/',
  authenticate,
  requirePermission('coupons:write'),
  validate({ body: couponCreateSchema }),
  couponController.create
);

/**
 * @swagger
 * /coupons/{id}:
 *   patch:
 *     summary: Update coupon details
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon updated
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('coupons:write'),
  validate({ body: couponUpdateSchema }),
  couponController.update
);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon deleted
 */
router.delete('/:id', authenticate, requirePermission('coupons:write'), couponController.delete);

module.exports = router;
