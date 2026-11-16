const express = require('express');
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { categoryCreateSchema, categoryUpdateSchema } = require('../validators/category.validator');

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories (storefront & admin)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', categoryController.getAll);

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category details
 */
router.get('/:slug', categoryController.getBySlug);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Evening Dresses" }
 *               description: { type: string }
 *               parentCategory: { type: string }
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
  '/',
  authenticate,
  requirePermission('categories:write'),
  validate({ body: categoryCreateSchema }),
  categoryController.create
);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('categories:write'),
  validate({ body: categoryUpdateSchema }),
  categoryController.update
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete('/:id', authenticate, requirePermission('categories:write'), categoryController.delete);

module.exports = router;
