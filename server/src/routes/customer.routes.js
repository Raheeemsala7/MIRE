const express = require('express');
const customerController = require('../controllers/customer.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List all customers with search and filters
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated customers
 */
router.get('/', requirePermission('customers:read'), customerController.getCustomers);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer details and recent order history
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer details
 */
router.get('/:id', requirePermission('customers:read'), customerController.getCustomerById);

/**
 * @swagger
 * /customers/{id}:
 *   patch:
 *     summary: Update customer tags, notes, or profile details
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer updated
 */
router.patch('/:id', requirePermission('customers:write'), customerController.updateCustomer);

module.exports = router;
