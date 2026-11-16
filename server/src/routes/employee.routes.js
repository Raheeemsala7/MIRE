const express = require('express');
const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middlewares/auth');
const { requireRole, requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { employeeCreateSchema, employeeUpdateSchema } = require('../validators/auth.validator');
const { UserRoles } = require('../models/User');

const router = express.Router();

router.use(authenticate);
router.use(requireRole(UserRoles.SUPER_ADMIN, UserRoles.ADMIN));

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all staff members
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated employees
 */
router.get('/', requirePermission('employees:read'), employeeController.getEmployees);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create new employee account
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, ORDER_MANAGER, CUSTOMER_SUPPORT, INVENTORY_MANAGER, ACCOUNTANT] }
 *               permissions: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Employee created
 */
router.post(
  '/',
  requirePermission('employees:write'),
  validate({ body: employeeCreateSchema }),
  employeeController.createEmployee
);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get single employee
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee details
 */
router.get('/:id', requirePermission('employees:read'), employeeController.getEmployeeById);

/**
 * @swagger
 * /employees/{id}:
 *   patch:
 *     summary: Update employee role and permissions
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee updated
 */
router.patch(
  '/:id',
  requirePermission('employees:write'),
  validate({ body: employeeUpdateSchema }),
  employeeController.updateEmployee
);

/**
 * @swagger
 * /employees/{id}/toggle-status:
 *   patch:
 *     summary: Activate/deactivate employee
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/toggle-status', requirePermission('employees:write'), employeeController.toggleEmployeeStatus);

module.exports = router;
