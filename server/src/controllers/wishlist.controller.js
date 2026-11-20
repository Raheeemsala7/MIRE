const wishlistService = require('../services/wishlist.service');
const ApiResponse = require('../utils/apiResponse');

class WishlistController {
  async getWishlist(req, res, next) {
    try {
      const { items, total, page, limit, wishlistId } = await wishlistService.getWishlist(
        req.user._id,
        req.query
      );

      return ApiResponse.paginated(res, {
        message: 'Wishlist retrieved successfully',
        data: items,
        page,
        limit,
        total,
        meta: { wishlistId }
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const productId = req.body.productId || req.params.productId;
      const variantSku = req.body.variantSku || req.body.sku || null;

      const result = await wishlistService.addToWishlist(req.user._id, {
        productId,
        variantSku
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const productId = req.params.productId || req.body.productId;
      const result = await wishlistService.removeFromWishlist(req.user._id, productId);

      return ApiResponse.success(res, {
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async checkStatus(req, res, next) {
    try {
      const result = await wishlistService.checkWishlistStatus(req.user._id, req.params.productId);
      return ApiResponse.success(res, {
        message: 'Wishlist status checked',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async clear(req, res, next) {
    try {
      const result = await wishlistService.clearWishlist(req.user._id);
      return ApiResponse.success(res, {
        message: result.message,
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WishlistController();
