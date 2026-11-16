const express = require('express');
const returnController = require('../controllers/return.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  requestReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  logReturnCallSchema
} = require('../validators/return.validator');

const router = express.Router();

/**
 * @swagger
 * /returns/request:
 *   post:
 *     summary: Submit a return request for a delivered order
 *     tags: [Returns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalOrderId, items, reason]
 *             properties:
 *               originalOrderId: { type: string }
 *               reason: { type: string, enum: [SIZE_TOO_SMALL, SIZE_TOO_LARGE, NOT_AS_PICTURED, DEFECTIVE, CHANGED_MIND, WRONG_ITEM_SENT, OTHER] }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     sku: { type: string }
 *                     color: { type: string }
 *                     size: { type: string }
 *                     quantity: { type: integer }
 *                     unitPrice: { type: number }
 *     responses:
 *       201:
 *         description: Return request initiated
 */
router.post('/request', optionalAuth, validate({ body: requestReturnSchema }), returnController.requestReturn);

/**
 * @swagger
 * /returns:
 *   get:
 *     summary: List return requests with filter by status
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated returns
 */
router.get('/', authenticate, requirePermission('returns:read'), returnController.getReturns);

/**
 * @swagger
 * /returns/{id}:
 *   get:
 *     summary: Get single return details
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Return details
 */
router.get('/:id', authenticate, requirePermission('returns:read'), returnController.getReturnById);

/**
 * @swagger
 * /returns/{id}/status:
 *   patch:
 *     summary: Update return status
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('returns:write'),
  validate({ body: updateReturnStatusSchema }),
  returnController.updateStatus
);

/**
 * @swagger
 * /returns/{id}/inspect:
 *   post:
 *     summary: Inspect returned items and conditionally restock inventory
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inspectionNotes, itemInspections]
 *             properties:
 *               inspectionNotes: { type: string }
 *               itemInspections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId: { type: string }
 *                     condition: { type: string, enum: [UNOPENED, TAGS_ATTACHED, WORN, DAMAGED, DEFECTIVE] }
 *                     restockApproved: { type: boolean }
 *     responses:
 *       200:
 *         description: Inspection recorded and inventory restocked if approved
 */
router.post(
  '/:id/inspect',
  authenticate,
  requirePermission('returns:write'),
  validate({ body: inspectReturnSchema }),
  returnController.inspect
);

/**
 * @swagger
 * /returns/{id}/call-attempt:
 *   post:
 *     summary: Log customer follow-up call attempt
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Call logged
 */
router.post(
  '/:id/call-attempt',
  authenticate,
  requirePermission('returns:write'),
  validate({ body: logReturnCallSchema }),
  returnController.logCall
);

/**
 * @swagger
 * /returns/{id}/assign:
 *   patch:
 *     summary: Assign return handling to employee
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Return assigned
 */
router.patch('/:id/assign', authenticate, requirePermission('returns:write'), returnController.assign);

module.exports = router;
