const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/apiResponse');

class AnalyticsController {
  async getDashboardMetrics(req, res, next) {
    try {
      const data = await analyticsService.getDashboardMetrics(req.query);
      return ApiResponse.success(res, {
        message: 'Dashboard metrics fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
