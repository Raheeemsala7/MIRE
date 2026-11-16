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
      const lowStockItems = await inventoryService.getLowStockItems();
      return ApiResponse.success(res, {
        message: 'Low stock items fetched successfully',
        data: lowStockItems
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
