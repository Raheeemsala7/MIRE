const orderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');

class OrderController {
  async checkout(req, res, next) {
    try {
      const order = await orderService.createOrderFromCart({
        userId: req.user?._id || null,
        guestId: req.headers['x-guest-id'] || req.body.guestId || null,
        ...req.body
      });
      return ApiResponse.created(res, {
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async createManual(req, res, next) {
    try {
      const order = await orderService.createManualOrder({
        ...req.body,
        performedBy: req.user._id
      });
      return ApiResponse.created(res, {
        message: 'Manual order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req, res, next) {
    try {
      // If customer, only see own orders
      const query = { ...req.query };
      if (req.user.role === 'CUSTOMER') {
        query.user = req.user._id;
      }

      const { orders, total, page, limit } = await orderService.getOrders(query);
      return ApiResponse.paginated(res, {
        message: 'Orders retrieved successfully',
        data: orders,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      return ApiResponse.success(res, {
        message: 'Order details fetched',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.body.reason,
        req.user._id
      );
      return ApiResponse.success(res, {
        message: `Order status updated to ${req.body.status}`,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateStatus(req, res, next) {
    try {
      const results = await orderService.bulkUpdateStatus(
        req.body.orderIds,
        req.body.status,
        req.body.reason,
        req.user._id
      );
      return ApiResponse.success(res, {
        message: 'Bulk status update completed',
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  async assignOrder(req, res, next) {
    try {
      const order = await orderService.assignOrder(req.params.id, req.body.employeeId, req.user._id);
      return ApiResponse.success(res, {
        message: 'Order assigned successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async addInternalNote(req, res, next) {
    try {
      const notes = await orderService.addInternalNote(req.params.id, req.body.note, req.user._id);
      return ApiResponse.success(res, {
        message: 'Internal note added',
        data: notes
      });
    } catch (error) {
      next(error);
    }
  }

  async logDeliveryAttempt(req, res, next) {
    try {
      const order = await orderService.logDeliveryAttempt(req.params.id, req.body, req.user._id);
      return ApiResponse.success(res, {
        message: 'Delivery call attempt recorded',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCSV(req, res, next) {
    try {
      const csv = await orderService.exportOrdersToCSV(req.query);
      res.header('Content-Type', 'text/csv');
      res.attachment(`orders-export-${Date.now()}.csv`);
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportExcel(req, res, next) {
    try {
      const buffer = await orderService.exportOrdersToExcel(req.query);
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`orders-export-${Date.now()}.xlsx`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
