const express = require('express');
const socialController = require('../controllers/social.controller');
const { verifyWebhook, handleWebhookEvent } = require('../webhooks/meta.webhook');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

const router = express.Router();

/**
 * @swagger
 * /social/webhook/meta:
 *   get:
 *     summary: Meta Webhook Challenge Verification (WhatsApp, IG, Messenger)
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Challenge echoed
 */
router.get('/webhook/meta', verifyWebhook);

/**
 * @swagger
 * /social/webhook/meta:
 *   post:
 *     summary: Ingest Meta Messaging Events (WhatsApp Cloud API, Instagram, Messenger)
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Event received
 */
router.post('/webhook/meta', handleWebhookEvent);

// Protected Staff Routes
router.use(authenticate);

/**
 * @swagger
 * /social/conversations:
 *   get:
 *     summary: List unified social inbox conversations
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated conversations
 */
router.get(
  '/conversations',
  requirePermission('social:read'),
  socialController.getConversations
);

/**
 * @swagger
 * /social/conversations/{id}/messages:
 *   get:
 *     summary: Get conversation message thread
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Message history
 */
router.get(
  '/conversations/:id/messages',
  requirePermission('social:read'),
  socialController.getMessages
);

/**
 * @swagger
 * /social/conversations/{id}/reply:
 *   post:
 *     summary: Send agent reply to customer on WhatsApp, IG, or Messenger
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string, example: "Hello! Your order has been dispatched." }
 *               mediaUrl: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post(
  '/conversations/:id/reply',
  requirePermission('social:write'),
  socialController.sendReply
);

/**
 * @swagger
 * /social/conversations/{id}:
 *   patch:
 *     summary: Update conversation status, assignee, or tags
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation updated
 */
router.patch(
  '/conversations/:id',
  requirePermission('social:write'),
  socialController.updateConversation
);

/**
 * @swagger
 * /social/conversations/{id}/convert-to-order:
 *   post:
 *     summary: Convert social conversation into an active order
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Order created and linked
 */
router.post(
  '/conversations/:id/convert-to-order',
  requirePermission('orders:write'),
  socialController.convertToOrder
);

/**
 * @swagger
 * /social/conversations/{id}/link-customer:
 *   post:
 *     summary: Link social conversation to existing customer profile
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer linked
 */
router.post(
  '/conversations/:id/link-customer',
  requirePermission('social:write'),
  socialController.linkCustomer
);

/**
 * @swagger
 * /social/accounts:
 *   get:
 *     summary: Get connected social accounts configuration status
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected channels
 */
router.get('/accounts', requirePermission('settings:read'), socialController.getSocialAccounts);

/**
 * @swagger
 * /social/accounts:
 *   post:
 *     summary: Connect a new social channel account
 *     tags: [Social Inbox]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account connected
 */
router.post('/accounts', requirePermission('settings:write'), socialController.connectSocialAccount);

module.exports = router;
