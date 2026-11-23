const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  checkoutCreateOrderSchema,
  manualCreateOrderSchema,
  updateOrderStatusSchema,
  bulkUpdateStatusSchema,
  assignOrderSchema,
  addInternalNoteSchema,
  logDeliveryAttemptSchema
} = require('../validators/order.validator');

const router = express.Router();

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Place order from cart (Customer or Guest)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerInfo, shippingAddress]
 *             properties:
 *               customerInfo:
 *                 type: object
 *                 properties:
 *                   fullName: { type: string, example: "Hala Mahmoud" }
 *                   phone: { type: string, example: "+201012345678" }
 *                   email: { type: string, example: "hala@example.com" }
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street: { type: string, example: "123 Nile Corniche" }
 *                   city: { type: string, example: "Zamalek" }
 *                   governorate: { type: string, example: "Cairo" }
 *               paymentMethod: { type: string, enum: [COD, STRIPE, PAYMOB], example: "COD" }
 *     responses:
 *       201:
 *         description: Order created with inventory reserved
 */
router.post(
  '/checkout',
  optionalAuth,
  validate({ body: checkoutCreateOrderSchema }),
  orderController.checkout
);

/**
 * @swagger
 * /orders/export/csv:
 *   get:
 *     summary: Export orders to CSV
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get(
  '/export/csv',
  authenticate,
  requirePermission('orders:export'),
  orderController.exportCSV
);

/**
 * @swagger
 * /orders/export/excel:
 *   get:
 *     summary: Export orders to Excel
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Excel spreadsheet download
 */
router.get(
  '/export/excel',
  authenticate,
  requirePermission('orders:export'),
  orderController.exportExcel
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List orders with filters (Admin/Staff) or Own Orders (Customer)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated orders
 */
router.get('/', authenticate, orderController.getOrders);

/**
 * @swagger
 * /orders/manual:
 *   post:
 *     summary: Create manual order (from Social Inbox or phone)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Manual order created
 */
router.post(
  '/manual',
  authenticate,
  requirePermission('orders:write'),
  validate({ body: manualCreateOrderSchema }),
  orderController.createManual
);

/**
 * @swagger
 * /orders/bulk-status:
 *   patch:
 *     summary: Bulk update order statuses
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bulk update results
 */
router.patch(
  '/bulk-status',
  authenticate,
  requirePermission('orders:write'),
  validate({ body: bulkUpdateStatusSchema }),
  orderController.bulkUpdateStatus
);

/**
 * @swagger
 * /orders/track/{orderNumber}:
 *   get:
 *     summary: Track public order status by order number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Live order tracking details
 */
router.get('/track/:orderNumber', optionalAuth, orderController.trackOrder.bind(orderController));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order details
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', authenticate, orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('orders:write'),
  validate({ body: updateOrderStatusSchema }),
  orderController.updateStatus
);

/**
 * @swagger
 * /orders/{id}/assign:
 *   patch:
 *     summary: Assign order to employee
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order assigned
 */
router.patch(
  '/:id/assign',
  authenticate,
  requirePermission('orders:write'),
  validate({ body: assignOrderSchema }),
  orderController.assignOrder
);

/**
 * @swagger
 * /orders/{id}/notes:
 *   post:
 *     summary: Add internal staff note to order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Note added
 */
router.post(
  '/:id/notes',
  authenticate,
  requirePermission('orders:write'),
  validate({ body: addInternalNoteSchema }),
  orderController.addInternalNote
);

/**
 * @swagger
 * /orders/{id}/delivery-attempt:
 *   post:
 *     summary: Log delivery or customer call attempt
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery attempt recorded
 */
router.post(
  '/:id/delivery-attempt',
  authenticate,
  requirePermission('orders:write'),
  validate({ body: logDeliveryAttemptSchema }),
  orderController.logDeliveryAttempt
);

module.exports = router;
