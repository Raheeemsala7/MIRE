const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

const router = express.Router();

/**
 * @swagger
 * /payments/session:
 *   post:
 *     summary: Create payment session (Stripe, Paymob, COD)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, method]
 *             properties:
 *               orderId: { type: string }
 *               method: { type: string, enum: [STRIPE, PAYMOB, COD] }
 *     responses:
 *       200:
 *         description: Payment session URL and ID
 */
router.post('/session', paymentController.createSession);

/**
 * @swagger
 * /payments/transactions:
 *   get:
 *     summary: List all payment transactions (Accountant / Admin)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated transaction list
 */
router.get(
  '/transactions',
  authenticate,
  requirePermission('payments:read'),
  paymentController.getTransactions
);

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Issue payment refund
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId]
 *             properties:
 *               transactionId: { type: string }
 *               amount: { type: number }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Refund status
 */
router.post('/refund', authenticate, requirePermission('payments:write'), paymentController.refund);

/**
 * @swagger
 * /payments/webhook/stripe:
 *   post:
 *     summary: Stripe Webhook Endpoint (HMAC signature verified)
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhook/stripe', paymentController.stripeWebhook);

/**
 * @swagger
 * /payments/webhook/paymob:
 *   post:
 *     summary: Paymob Transaction Callback Webhook (HMAC verified)
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/paymob', paymentController.paymobWebhook);

/**
 * @swagger
 * /payments/webhook/daftarcash:
 *   post:
 *     summary: DaftarCash E-Wallets & InstaPay Webhook (HMAC verified)
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/daftarcash', paymentController.daftarCashWebhook);

module.exports = router;
