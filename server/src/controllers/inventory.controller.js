const inventoryService = require('../services/inventory.service');
const ApiResponse = require('../utils/apiResponse');

class InventoryController {
  async adjustStock(req, res, next) {
    try {
      const { product, movement } = await inventoryService.adjustStock({
        ...req.body,
        performedBy: req.user._id,
        req
      });

      return ApiResponse.success(res, {
        message: 'Stock adjusted successfully',
        data: { product, movement }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMovements(req, res, next) {
    try {
      const { movements, total, page, limit } = await inventoryService.getMovements(req.query);
      return ApiResponse.paginated(res, {
        message: 'Inventory movements fetched successfully',
        data: movements,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStockAlerts(req, res, next) {
    try {
      const result = await inventoryService.getLowStockItems(req.query);
      if (result && result.isPaginated) {
        return ApiResponse.paginated(res, {
          message: 'Low stock items fetched successfully',
          data: result.items,
          page: result.page,
          limit: result.limit,
          total: result.total
        });
      }
      return ApiResponse.success(res, {
        message: 'Low stock items fetched successfully',
        data: Array.isArray(result) ? result : (result?.items || [])
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
