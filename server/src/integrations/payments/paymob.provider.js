const crypto = require('crypto');
const axios = require('axios');
const PaymentProviderInterface = require('./payment.provider.interface');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');

class PaymobProvider extends PaymentProviderInterface {
  constructor() {
    super();
    this.apiKey = env.PAYMOB.API_KEY;
    this.integrationId = env.PAYMOB.INTEGRATION_ID;
    this.iframeId = env.PAYMOB.IFRAME_ID;
    this.hmacSecret = env.PAYMOB.HMAC_SECRET;
    this.baseUrl = 'https://accept.paymob.com/api';
  }

  async authenticate() {
    const response = await axios.post(`${this.baseUrl}/auth/tokens`, {
      api_key: this.apiKey
    });
    return response.data.token;
  }

  async createPaymentSession({ order, customer }) {
    try {
      // If credentials aren't set in dev, return simulated paymob session for testing
      if (!this.apiKey || this.apiKey === 'dummy_paymob_api_key') {
        const simulatedToken = `mock_paymob_token_${Date.now()}`;
        return {
          sessionId: simulatedToken,
          paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId || '123456'}?payment_token=${simulatedToken}`,
          transactionId: simulatedToken
        };
      }

      // 1. Authenticate
      const authToken = await this.authenticate();

      // 2. Order Registration
      const orderAmountCents = Math.round(order.pricing.totalAmount * 100);
      const orderRes = await axios.post(`${this.baseUrl}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: orderAmountCents,
        currency: 'EGP',
        merchant_order_id: order.orderNumber,
        items: []
      });
      const paymobOrderId = orderRes.data.id;

      // 3. Payment Key Request
      const nameParts = (order.customerInfo.fullName || 'Customer').split(' ');
      const paymentKeyRes = await axios.post(`${this.baseUrl}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: orderAmountCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          apartment: order.shippingAddress?.apartment || 'NA',
          email: order.customerInfo?.email || 'customer@mirefashion.com',
          floor: 'NA',
          first_name: nameParts[0] || 'Valued',
          street: order.shippingAddress?.street || 'Nile St',
          building: order.shippingAddress?.building || 'NA',
          phone_number: order.customerInfo?.phone || '+201000000000',
          shipping_method: 'PKG',
          postal_code: 'NA',
          city: order.shippingAddress?.city || 'Cairo',
          country: 'EGY',
          last_name: nameParts.slice(1).join(' ') || 'Customer',
          state: order.shippingAddress?.governorate || 'Cairo'
        },
        currency: 'EGP',
        integration_id: this.integrationId
      });

      const paymentToken = paymentKeyRes.data.token;
      const paymentUrl = `${this.baseUrl}/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`;

      return {
        sessionId: String(paymobOrderId),
        paymentUrl,
        transactionId: String(paymobOrderId)
      };
    } catch (err) {
      logger.error('Paymob session creation error:', err.response?.data || err.message);
      throw ApiError.badRequest(`Paymob payment initialization failed: ${err.message}`);
    }
  }

  verifyWebhookSignature({ query, body }) {
    if (!this.hmacSecret || this.hmacSecret === 'dummy_paymob_hmac_secret') {
      return true; // Pass in development/mock mode
    }

    const obj = body?.obj || body;
    const hmacReceived = query?.hmac || body?.hmac;

    // Standard Paymob HMAC concatenated fields in exact order
    const concatenatedString = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id || obj.order,
      obj.owner,
      obj.pending,
      obj.source_data?.pan || '',
      obj.source_data?.sub_type || '',
      obj.source_data?.type || '',
      obj.success
    ].join('');

    const calculatedHmac = crypto.createHmac('sha512', this.hmacSecret).update(concatenatedString).digest('hex');
    return calculatedHmac === hmacReceived;
  }

  async handleWebhookEvent(body) {
    const obj = body?.obj || body;
    const isSuccess = obj.success === true || obj.success === 'true';
    const status = isSuccess ? 'PAID' : 'FAILED';
    const transactionId = String(obj.id);
    const orderNumber = obj.order?.merchant_order_id;

    return {
      orderNumber,
      status,
      transactionId,
      raw: obj
    };
  }

  async processRefund({ transactionId, amount }) {
    const authToken = await this.authenticate();
    const res = await axios.post(`${this.baseUrl}/acceptance/void_refund/refund`, {
      auth_token: authToken,
      transaction_id: transactionId,
      amount_cents: Math.round(amount * 100)
    });

    return {
      refundId: String(res.data.id),
      status: 'REFUNDED',
      amount
    };
  }
}

module.exports = PaymobProvider;
