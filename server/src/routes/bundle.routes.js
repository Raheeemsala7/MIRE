const express = require('express');
const bundleController = require('../controllers/bundle.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { bundleCreateSchema, bundleUpdateSchema } = require('../validators/promotion.validator');

const router = express.Router();

/**
 * @swagger
 * /bundles:
 *   get:
 *     summary: List all bundles & promotions
 *     tags: [Bundles & Offers]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of bundle promotions
 */
router.get('/', bundleController.getAll);

/**
 * @swagger
 * /bundles/{id}:
 *   get:
 *     summary: Get bundle details with eligible products
 *     tags: [Bundles & Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bundle details
 */
router.get('/:id', bundleController.getById);

/**
 * @swagger
 * /bundles:
 *   post:
 *     summary: Create new promotional bundle
 *     tags: [Bundles & Offers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Bundle created
 */
router.post(
  '/',
  authenticate,
  requirePermission('bundles:write'),
  validate({ body: bundleCreateSchema }),
  bundleController.create
);

/**
 * @swagger
 * /bundles/{id}:
 *   patch:
 *     summary: Update bundle details
 *     tags: [Bundles & Offers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bundle updated
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('bundles:write'),
  validate({ body: bundleUpdateSchema }),
  bundleController.update
);

/**
 * @swagger
 * /bundles/{id}:
 *   delete:
 *     summary: Delete bundle
 *     tags: [Bundles & Offers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bundle deleted
 */
router.delete('/:id', authenticate, requirePermission('bundles:write'), bundleController.delete);

module.exports = router;
