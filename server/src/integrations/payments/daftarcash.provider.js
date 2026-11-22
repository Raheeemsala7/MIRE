const crypto = require('crypto');
const axios = require('axios');
const PaymentProviderInterface = require('./payment.provider.interface');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');

class DaftarCashProvider extends PaymentProviderInterface {
  constructor() {
    super();
    this.apiKey = env.DAFTAR_CASH?.API_KEY;
    this.webhookSecret = env.DAFTAR_CASH?.WEBHOOK_SECRET;
    this.baseUrl = env.DAFTAR_CASH?.BASE_URL || 'https://daftarcash.com';
  }

  /**
   * Create payment checkout session with DaftarCash API
   * POST /api/v1/payments/create/
   */
  async createPaymentSession({ order, customer, successUrl }) {
    try {
      const amount = Number(order.pricing?.totalAmount || 0);
      const orderNumber = order.orderNumber;
      const redirectUrl = successUrl || `https://mirefashion.com/ar/checkout?orderNumber=${orderNumber}`;

      // In testing / sandbox mode if credentials aren't set yet
      if (!this.apiKey || this.apiKey.includes('dummy') || this.apiKey.includes('placeholder')) {
        const mockPaymentId = `dc_test_${Date.now()}`;
        logger.info(`[DaftarCash Test Mode] Simulated checkout session created for order ${orderNumber} (${amount} EGP)`);
        return {
          sessionId: mockPaymentId,
          paymentUrl: `https://daftarcash.com/gateway/docs/?simulated_payment_id=${mockPaymentId}&amount=${amount}&order=${orderNumber}`,
          transactionId: mockPaymentId
        };
      }

      // Live / Sandbox API call to DaftarCash
      const response = await axios.post(
        `${this.baseUrl}/api/v1/payments/create/`,
        {
          amount,
          merchant_order_id: orderNumber,
          redirect_url: redirectUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-Key': this.apiKey
          },
          timeout: 15000
        }
      );

      const resData = response.data;
      const paymentData = resData.data || resData;
      const paymentId = paymentData.payment_id || paymentData.id || resData.payment_id;
      const checkoutUrl = paymentData.checkout_url || resData.checkout_url;

      if (!checkoutUrl) {
        throw new Error(resData.message || 'No checkout_url returned from DaftarCash');
      }

      return {
        sessionId: String(paymentId),
        paymentUrl: checkoutUrl,
        transactionId: String(paymentId)
      };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'DaftarCash API error';
      logger.error('DaftarCash session creation error:', errorMsg);
      throw ApiError.badRequest(`DaftarCash payment initialization failed: ${errorMsg}`);
    }
  }

  /**
   * Verify incoming webhook signature (HMAC-SHA256)
   * Header: X-VodaCash-Signature
   */
  verifyWebhookSignature({ rawBody, headers }) {
    if (!this.webhookSecret || this.webhookSecret.includes('dummy')) {
      return true; // Pass in development/test mode
    }

    const receivedSignature =
      headers['x-vodacash-signature'] ||
      headers['x-daftarcash-signature'] ||
      headers['x-signature'];

    if (!receivedSignature || !rawBody) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      const receivedBuf = Buffer.from(receivedSignature);
      const expectedBuf = Buffer.from(expectedSignature);

      return (
        receivedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(receivedBuf, expectedBuf)
      );
    } catch (err) {
      logger.error('Error verifying DaftarCash webhook signature:', err.message);
      return false;
    }
  }

  /**
   * Process webhook payload
   */
  async handleWebhookEvent(event) {
    const data = event.data || event;

    // Check for test ping notification (sent when merchant clicks "اتأكد إن متجري بيستلم الـ Webhook")
    const isTestPing =
      event.event === 'test' ||
      data.event === 'test' ||
      event.type === 'test' ||
      data.type === 'test' ||
      (!data.merchant_order_id && !data.payment_id);

    if (isTestPing) {
      logger.info('[DaftarCash Webhook] Verified test ping notification successfully');
      return {
        isTestPing: true,
        orderNumber: null,
        status: null,
        transactionId: 'test_ping',
        raw: event
      };
    }

    const orderNumber = data.merchant_order_id || data.order_id || event.merchant_order_id;
    const paymentId = data.payment_id || event.payment_id || `dc_${Date.now()}`;
    const statusRaw = (data.status || event.status || '').toLowerCase();

    let status = 'PENDING';
    if (statusRaw === 'completed' || statusRaw === 'paid' || statusRaw === 'success') {
      status = 'PAID';
    } else if (statusRaw === 'failed' || statusRaw === 'cancelled' || statusRaw === 'expired') {
      status = 'FAILED';
    }

    return {
      orderNumber,
      status,
      transactionId: String(paymentId),
      raw: event
    };
  }

  /**
   * Query payment status
   * GET /api/v1/payments/status/{payment_id}/
   */
  async checkPaymentStatus(paymentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/payments/status/${paymentId}/`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (err) {
      logger.error(`Error querying DaftarCash payment status for ${paymentId}:`, err.message);
      throw err;
    }
  }

  async processRefund() {
    throw new Error('DaftarCash does not support programmatic refunds; transfers go directly to merchant wallet.');
  }
}

module.exports = DaftarCashProvider;
