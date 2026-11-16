const promotionService = require('../services/promotion.service');
const ApiResponse = require('../utils/apiResponse');

class CouponController {
  async getAll(req, res, next) {
    try {
      const { coupons, total, page, limit } = await promotionService.getAllCoupons(req.query);
      return ApiResponse.paginated(res, {
        message: 'Coupons fetched successfully',
        data: coupons,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const coupon = await promotionService.createCoupon(req.body);
      return ApiResponse.created(res, {
        message: 'Coupon created successfully',
        data: coupon
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const coupon = await promotionService.updateCoupon(req.params.id, req.body);
      return ApiResponse.success(res, {
        message: 'Coupon updated successfully',
        data: coupon
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await promotionService.deleteCoupon(req.params.id);
      return ApiResponse.success(res, {
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCoupon(req, res, next) {
    try {
      const { code, subtotal } = req.body;
      const result = await promotionService.evaluateCouponDiscount(
        code,
        subtotal || 0,
        req.user?._id,
        req.user?.email
      );
      return ApiResponse.success(res, {
        message: 'Coupon is valid',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CouponController();
