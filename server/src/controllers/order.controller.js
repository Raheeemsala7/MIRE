const orderService = require('../services/order.service');
const paymentService = require('../services/payment.service');
const Customer = require('../models/Customer');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

class OrderController {
  async checkout(req, res, next) {
    try {
      const order = await orderService.createOrderFromCart({
        ...req.body,
        userId: req.user?._id || null,
        guestId: req.user ? null : (req.headers['x-guest-id'] || req.body.guestId || null)
      });

      let checkoutUrl = null;
      if (order.paymentInfo.method === 'DAFTAR_CASH') {
        try {
          const rawOrigin =
            req.body.origin ||
            req.headers.origin ||
            req.headers.referer ||
            (req.headers['x-forwarded-host'] ? `https://${req.headers['x-forwarded-host']}` : null) ||
            'http://localhost:3000';
          const cleanOrigin = String(rawOrigin).replace(/\/$/, '');
          const returnUrl =
            req.body.returnUrl ||
            `${cleanOrigin}/ar/checkout?orderNumber=${order.orderNumber}&payment=success`;
          const session = await paymentService.createPaymentSession(order._id, 'DAFTAR_CASH', returnUrl);
          checkoutUrl = session.paymentUrl;
        } catch (err) {
          console.error('Failed to create DaftarCash payment session:', err.message);
        }
      }

      return ApiResponse.created(res, {
        message: 'Order created successfully',
        data: {
          ...order.toObject(),
          checkoutUrl
        }
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
      const query = { ...req.query };

      const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'CUSTOMER_SUPPORT', 'ACCOUNTANT'].includes(req.user.role);

      if (!isStaffOrAdmin) {
        // Strict customer ownership: enforce authenticated user's ID and strip client overrides
        query.user = req.user._id;
        delete query.customer;
        delete query.assignedEmployee;
      } else {
        // Staff/Admin access requires orders:read permission
        if (req.user.role !== 'SUPER_ADMIN' && !req.user.hasPermission('orders:read')) {
          throw ApiError.forbidden('Missing required permission: orders:read');
        }
      }

      const { orders, total, page, limit } = await orderService.getOrders(query);

      // Strip admin-only internal fields for non-staff/customer responses
      const sanitizedOrders = !isStaffOrAdmin
        ? orders.map((order) => {
            const obj = order.toObject ? order.toObject() : { ...order };
            delete obj.internalNotes;
            delete obj.assignedEmployee;
            return obj;
          })
        : orders;

      return ApiResponse.paginated(res, {
        message: 'Orders retrieved successfully',
        data: sanitizedOrders,
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

      const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'CUSTOMER_SUPPORT', 'ACCOUNTANT'].includes(req.user.role);

      // Strict role-based and ownership verification
      if (!isStaffOrAdmin) {
        const orderUserId = order.user?._id?.toString() || order.user?.toString();
        const customerUserId = order.customer?.user?._id?.toString() || order.customer?.user?.toString();
        const currentUserId = req.user._id.toString();

        let customerMatches = false;
        if (customerUserId) {
          customerMatches = customerUserId === currentUserId;
        } else if (order.customer) {
          const custId = order.customer._id || order.customer;
          const matchingCustomer = await Customer.findOne({ _id: custId, user: req.user._id });
          customerMatches = Boolean(matchingCustomer);
        }

        const isOwner = (orderUserId && orderUserId === currentUserId) || customerMatches;

        if (!isOwner) {
          throw ApiError.forbidden('Access denied. You do not have permission to view this order.');
        }

        const orderData = order.toObject ? order.toObject() : { ...order };
        delete orderData.internalNotes;
        delete orderData.assignedEmployee;
        delete orderData.deliveryAttempts;

        return ApiResponse.success(res, {
          message: 'Order details fetched',
          data: orderData
        });
      } else {
        // Staff / Admin check
        if (req.user.role !== 'SUPER_ADMIN' && !req.user.hasPermission('orders:read')) {
          throw ApiError.forbidden('Missing required permission: orders:read');
        }

        return ApiResponse.success(res, {
          message: 'Order details fetched',
          data: order
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async trackOrder(req, res, next) {
    try {
      const order = await orderService.trackOrder(req.params.orderNumber, req.user);
      return ApiResponse.success(res, {
        message: 'Order tracking details retrieved',
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
