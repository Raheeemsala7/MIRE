const PaymentProviderInterface = require('./payment.provider.interface');

class CodProvider extends PaymentProviderInterface {
  async createPaymentSession({ order }) {
    return {
      sessionId: `COD-${order.orderNumber}`,
      paymentUrl: `/orders/confirmation/${order._id}`,
      transactionId: `COD-${order.orderNumber}`
    };
  }

  verifyWebhookSignature() {
    return true;
  }

  async handleWebhookEvent(event) {
    return {
      orderId: event.orderId,
      status: 'PAID',
      transactionId: event.transactionId,
      raw: event
    };
  }

  async processRefund({ amount, reason }) {
    return {
      refundId: `COD-REF-${Date.now()}`,
      status: 'REFUNDED',
      amount,
      reason: reason || 'Cash refund on return'
    };
  }
}

module.exports = CodProvider;
