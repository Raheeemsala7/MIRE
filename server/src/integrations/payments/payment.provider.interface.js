/**
 * Abstract Payment Provider Interface
 */
class PaymentProviderInterface {
  /**
   * Create payment checkout session or intent
   * @param {Object} params
   * @returns {Promise<{ sessionId: string, paymentUrl: string, transactionId: string }>}
   */
  async createPaymentSession(params) {
    throw new Error('createPaymentSession must be implemented');
  }

  /**
   * Verify incoming webhook signature
   * @param {Object} params
   * @returns {Promise<boolean>}
   */
  async verifyWebhookSignature(params) {
    throw new Error('verifyWebhookSignature must be implemented');
  }

  /**
   * Process incoming webhook event
   * @param {Object} event
   * @returns {Promise<{ orderId: string, status: string, transactionId: string, raw: Object }>}
   */
  async handleWebhookEvent(event) {
    throw new Error('handleWebhookEvent must be implemented');
  }

  /**
   * Process refund
   * @param {Object} params
   * @returns {Promise<{ refundId: string, status: string, amount: number }>}
   */
  async processRefund(params) {
    throw new Error('processRefund must be implemented');
  }
}

module.exports = PaymentProviderInterface;
