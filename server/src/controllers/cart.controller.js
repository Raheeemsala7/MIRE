const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/apiResponse');

class CartController {
  _getAuthIdentifiers(req) {
    const userId = req.user?._id || null;
    const guestId = req.headers['x-guest-id'] || req.query.guestId || null;
    return { userId, guestId };
  }

  async getCart(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.getOrCreateCart({ userId, guestId });
      return ApiResponse.success(res, {
        message: 'Cart retrieved successfully',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.addItem({
        ...req.body,
        userId,
        guestId
      });
      return ApiResponse.success(res, {
        message: 'Item added to cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.updateItem({
        userId,
        guestId,
        itemId: req.params.itemId,
        quantity: req.body.quantity
      });
      return ApiResponse.success(res, {
        message: 'Cart item updated',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.removeItem({
        userId,
        guestId,
        itemId: req.params.itemId
      });
      return ApiResponse.success(res, {
        message: 'Item removed from cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async applyBundle(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.applyBundle({
        userId,
        guestId,
        bundleId: req.body.bundleId
      });
      return ApiResponse.success(res, {
        message: 'Bundle applied to cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.applyCoupon({
        userId,
        guestId,
        couponCode: req.body.couponCode
      });
      return ApiResponse.success(res, {
        message: 'Coupon applied successfully',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.removeCoupon({ userId, guestId });
      return ApiResponse.success(res, {
        message: 'Coupon removed from cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async setGovernorate(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      const cart = await cartService.setGovernorate({
        userId,
        guestId,
        governorate: req.body.governorate
      });
      return ApiResponse.success(res, {
        message: 'Shipping governorate updated',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const { userId, guestId } = this._getAuthIdentifiers(req);
      await cartService.clearCart({ userId, guestId });
      return ApiResponse.success(res, {
        message: 'Cart cleared'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
