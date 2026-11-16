const returnService = require('../services/return.service');
const ApiResponse = require('../utils/apiResponse');

class ReturnController {
  async requestReturn(req, res, next) {
    try {
      const returnDoc = await returnService.requestReturn({
        ...req.body,
        performedBy: req.user?._id || null
      });
      return ApiResponse.created(res, {
        message: 'Return request submitted successfully',
        data: returnDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async getReturns(req, res, next) {
    try {
      const { returns, total, page, limit } = await returnService.getReturns(req.query);
      return ApiResponse.paginated(res, {
        message: 'Returns fetched successfully',
        data: returns,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getReturnById(req, res, next) {
    try {
      const returnDoc = await returnService.getReturnById(req.params.id);
      return ApiResponse.success(res, {
        message: 'Return details fetched',
        data: returnDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const returnDoc = await returnService.updateStatus(
        req.params.id,
        req.body.status,
        req.body.notes,
        req.user._id
      );
      return ApiResponse.success(res, {
        message: 'Return status updated',
        data: returnDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async inspect(req, res, next) {
    try {
      const returnDoc = await returnService.inspectReturn(req.params.id, req.body, req.user._id);
      return ApiResponse.success(res, {
        message: 'Inspection completed and eligible inventory restocked',
        data: returnDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async logCall(req, res, next) {
    try {
      const returnDoc = await returnService.logCallAttempt(req.params.id, req.body, req.user._id);
      return ApiResponse.success(res, {
        message: 'Call attempt recorded',
        data: returnDoc
      });
    } catch (error) {
      next(error);
    }
  }

  async assign(req, res, next) {
    try {
      const returnDoc = await returnService.assignReturn(req.params.id, req.body.employeeId, req.user._id);
      return ApiResponse.success(res, {
        message: 'Return assigned successfully',
        data: returnDoc
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReturnController();
