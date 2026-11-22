const paymentFactory = require('../integrations/payments/payment.factory');
const PaymentTransaction = require('../models/PaymentTransaction');
const { Order, PaymentStatuses } = require('../models/Order');
const ApiError = require('../utils/apiError');
const { recordAudit } = require('../utils/auditLogger');
const { getPaginationOptions } = require('../utils/pagination');

class PaymentService {
  /**
   * Initiate payment session with abstract provider
   */
  async createPaymentSession(orderId, method, returnUrl, cancelUrl) {
    const order = await Order.findById(orderId).populate('customer');
    if (!order) throw ApiError.notFound('Order not found');

    if (order.paymentInfo.status === PaymentStatuses.PAID) {
      throw ApiError.badRequest('Order is already paid');
    }

    const provider = paymentFactory.getProvider(method || order.paymentInfo.method);
    const session = await provider.createPaymentSession({
      order,
      customer: order.customer,
      successUrl: returnUrl,
      cancelUrl
    });

    // Create or update initial payment transaction record
    await PaymentTransaction.create({
      provider: method || order.paymentInfo.method,
      transactionId: session.transactionId,
      order: order._id,
      customer: order.customer?._id || null,
      amount: order.pricing.totalAmount,
      status: PaymentStatuses.PENDING
    });

    order.paymentInfo.method = method || order.paymentInfo.method;
    order.paymentInfo.transactionId = session.transactionId;
    await order.save();

    return session;
  }

  /**
   * Secure Webhook Handler (Stripe, Paymob)
   */
  async processWebhook(providerName, { rawBody, body, headers, query }) {
    const provider = paymentFactory.getProvider(providerName);

    // 1. Verify Signature
    if (providerName.toUpperCase() === 'STRIPE') {
      const signature = headers['stripe-signature'];
      const event = provider.verifyWebhookSignature({ payload: rawBody, signature });
      const { orderId, status, transactionId, raw } = await provider.handleWebhookEvent(event);

      if (orderId && status) {
        await this.updatePaymentStatus(orderId, status, transactionId, raw, 'STRIPE');
      }
      return { received: true };
    }

    if (providerName.toUpperCase() === 'PAYMOB') {
      const isValid = provider.verifyWebhookSignature({ query, body });
      if (!isValid) {
        throw ApiError.badRequest('Invalid Paymob HMAC signature');
      }
      const { orderNumber, status, transactionId, raw } = await provider.handleWebhookEvent(body);
      if (orderNumber) {
        const order = await Order.findOne({ orderNumber });
        if (order) {
          await this.updatePaymentStatus(order._id, status, transactionId, raw, 'PAYMOB');
        }
      }
      return { received: true };
    }

    if (providerName.toUpperCase() === 'DAFTAR_CASH') {
      const isValid = provider.verifyWebhookSignature({ rawBody, headers });
      if (!isValid) {
        throw ApiError.badRequest('Invalid DaftarCash signature');
      }
      const { orderNumber, status, transactionId, raw, isTestPing } = await provider.handleWebhookEvent(body);
      if (isTestPing) {
        return { received: true, message: 'DaftarCash test webhook verified successfully' };
      }
      if (orderNumber) {
        const order = await Order.findOne({ orderNumber });
        if (order) {
          await this.updatePaymentStatus(order._id, status, transactionId, raw, 'DAFTAR_CASH');
        }
      }
      return { received: true };
    }
  }

  /**
   * Update Payment Status internally
   */
  async updatePaymentStatus(orderId, status, transactionId, rawPayload, provider) {
    const order = await Order.findById(orderId);
    if (!order) return;

    order.paymentInfo.status = status;
    order.paymentInfo.transactionId = transactionId;
    if (status === PaymentStatuses.PAID) {
      order.paymentInfo.paidAt = new Date();
      if (order.status === 'NEW') {
        order.status = 'CONFIRMED';
      }
    }
    await order.save();

    // Update Transaction record
    await PaymentTransaction.findOneAndUpdate(
      { order: order._id, provider },
      {
        $set: {
          status,
          transactionId,
          rawResponse: rawPayload
        }
      },
      { upsert: true, new: true }
    );

    await recordAudit({
      action: 'PAYMENT_STATUS_WEBHOOK_UPDATED',
      entityType: 'Order',
      entityId: order._id,
      newState: { paymentStatus: status, transactionId }
    });
  }

  /**
   * Process refund through provider
   */
  async refundPayment(transactionId, amount, reason, performedBy) {
    const tx = await PaymentTransaction.findOne({ transactionId });
    if (!tx) throw ApiError.notFound('Payment transaction not found');

    const provider = paymentFactory.getProvider(tx.provider);
    const refundResult = await provider.processRefund({
      transactionId: tx.transactionId,
      amount: amount || tx.amount,
      reason
    });

    tx.status = amount && amount < tx.amount ? PaymentStatuses.PARTIALLY_REFUNDED : PaymentStatuses.REFUNDED;
    tx.refundDetails = {
      refundId: refundResult.refundId,
      refundAmount: refundResult.amount,
      reason,
      refundedAt: new Date()
    };
    await tx.save();

    // Update order payment status
    await Order.findByIdAndUpdate(tx.order, {
      $set: { 'paymentInfo.status': tx.status }
    });

    await recordAudit({
      action: 'PAYMENT_REFUNDED',
      entityType: 'PaymentTransaction',
      entityId: tx._id,
      performedBy,
      details: refundResult
    });

    return { tx, refundResult };
  }

  /**
   * List paginated transactions (for Accountant / Admin)
   */
  async getTransactions(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};
    if (query.provider) filter.provider = query.provider;
    if (query.status) filter.status = query.status;

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(filter)
        .populate('order', 'orderNumber status pricing')
        .populate('customer', 'fullName phone email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      PaymentTransaction.countDocuments(filter)
    ]);

    return { transactions, total, page, limit };
  }
}

module.exports = new PaymentService();
