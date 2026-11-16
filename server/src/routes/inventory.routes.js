const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { stockAdjustmentSchema } = require('../validators/product.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /inventory/adjust:
 *   post:
 *     summary: Manually adjust stock for a variant with audit trail
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, variantSku, quantityChange, type, reason]
 *             properties:
 *               productId: { type: string }
 *               variantSku: { type: string }
 *               quantityChange: { type: integer, example: 10 }
 *               type: { type: string, enum: [PURCHASE, SALE, RETURN, ADJUSTMENT, DAMAGE] }
 *               reason: { type: string, example: "New supplier shipment batch received" }
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 */
router.post(
  '/adjust',
  requirePermission('inventory:write'),
  validate({ body: stockAdjustmentSchema }),
  inventoryController.adjustStock
);

/**
 * @swagger
 * /inventory/movements:
 *   get:
 *     summary: List paginated stock movement audit trail
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated inventory movements
 */
router.get('/movements', requirePermission('inventory:read'), inventoryController.getMovements);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get low stock alerts for inventory replenishment
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock product variants
 */
router.get('/low-stock', requirePermission('inventory:read'), inventoryController.getLowStockAlerts);

module.exports = router;
