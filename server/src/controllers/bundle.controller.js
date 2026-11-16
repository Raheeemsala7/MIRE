const promotionService = require('../services/promotion.service');
const ApiResponse = require('../utils/apiResponse');

class BundleController {
  async getAll(req, res, next) {
    try {
      const { bundles, total, page, limit } = await promotionService.getAllBundles(req.query);
      return ApiResponse.paginated(res, {
        message: 'Bundles fetched successfully',
        data: bundles,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const bundle = await promotionService.getBundleById(req.params.id);
      return ApiResponse.success(res, {
        message: 'Bundle fetched successfully',
        data: bundle
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const bundle = await promotionService.createBundle(req.body);
      return ApiResponse.created(res, {
        message: 'Bundle created successfully',
        data: bundle
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const bundle = await promotionService.updateBundle(req.params.id, req.body);
      return ApiResponse.success(res, {
        message: 'Bundle updated successfully',
        data: bundle
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await promotionService.deleteBundle(req.params.id);
      return ApiResponse.success(res, {
        message: 'Bundle deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BundleController();
