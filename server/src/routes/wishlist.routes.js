const express = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addToWishlistSchema } = require('../validators/wishlist.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Retrieve user's paginated wishlist items
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated wishlist items
 */
router.get('/', wishlistController.getWishlist.bind(wishlistController));

/**
 * @swagger
 * /wishlist/check/{productId}:
 *   get:
 *     summary: Check if a product is in current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Wishlist boolean status
 */
router.get('/check/:productId', wishlistController.checkStatus.bind(wishlistController));

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string }
 *               variantSku: { type: string }
 *     responses:
 *       200:
 *         description: Product added to wishlist
 */
router.post(
  '/',
  validate({ body: addToWishlistSchema }),
  wishlistController.addItem.bind(wishlistController)
);

// Alias: /wishlist/add
router.post(
  '/add',
  validate({ body: addToWishlistSchema }),
  wishlistController.addItem.bind(wishlistController)
);

// Alias: /wishlist/items
router.post(
  '/items',
  validate({ body: addToWishlistSchema }),
  wishlistController.addItem.bind(wishlistController)
);

// Shortcut: /wishlist/:productId
router.post(
  '/:productId',
  wishlistController.addItem.bind(wishlistController)
);

/**
 * @swagger
 * /wishlist/items/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 */
router.delete('/items/:productId', wishlistController.removeItem.bind(wishlistController));

// Shortcut: /wishlist/:productId
router.delete('/:productId', wishlistController.removeItem.bind(wishlistController));

/**
 * @swagger
 * /wishlist:
 *   delete:
 *     summary: Clear all items in user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared
 */
router.delete('/', wishlistController.clear.bind(wishlistController));

module.exports = router;
