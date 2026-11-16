const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');

class PaymentController {
  async createSession(req, res, next) {
    try {
      const { orderId, method, returnUrl, cancelUrl } = req.body;
      const session = await paymentService.createPaymentSession(orderId, method, returnUrl, cancelUrl);
      return ApiResponse.success(res, {
        message: 'Payment session created',
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  async stripeWebhook(req, res, next) {
    try {
      const result = await paymentService.processWebhook('STRIPE', {
        rawBody: req.rawBody || req.body,
        headers: req.headers
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async paymobWebhook(req, res, next) {
    try {
      const result = await paymentService.processWebhook('PAYMOB', {
        body: req.body,
        query: req.query,
        headers: req.headers
      });
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refund(req, res, next) {
    try {
      const { transactionId, amount, reason } = req.body;
      const result = await paymentService.refundPayment(transactionId, amount, reason, req.user._id);
      return ApiResponse.success(res, {
        message: 'Refund processed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const { transactions, total, page, limit } = await paymentService.getTransactions(req.query);
      return ApiResponse.paginated(res, {
        message: 'Transactions retrieved successfully',
        data: transactions,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
