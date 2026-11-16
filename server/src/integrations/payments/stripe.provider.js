const PaymentProviderInterface = require('./payment.provider.interface');
const stripe = require('../../config/stripe');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');

class StripeProvider extends PaymentProviderInterface {
  constructor() {
    super();
    this.stripe = stripe;
    this.webhookSecret = env.STRIPE.WEBHOOK_SECRET;
  }

  async createPaymentSession({ order, customer, successUrl, cancelUrl }) {
    if (!this.stripe) {
      throw ApiError.internal('Stripe is not configured in this environment');
    }

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'egp',
        product_data: {
          name: item.name,
          description: `${item.color} / ${item.size} (SKU: ${item.sku})`
        },
        unit_amount: Math.round(item.unitPrice * 100) // Stripe expects cents/piastres
      },
      quantity: item.quantity
    }));

    // Add shipping fee if present
    if (order.pricing.shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'egp',
          product_data: {
            name: 'Shipping Fee'
          },
          unit_amount: Math.round(order.pricing.shippingFee * 100)
        },
        quantity: 1
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      client_reference_id: order._id.toString(),
      customer_email: order.customerInfo?.email || undefined,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: customer?._id?.toString() || ''
      },
      success_url: successUrl || `http://localhost:3000/checkout/success?orderId=${order._id}`,
      cancel_url: cancelUrl || `http://localhost:3000/checkout/cancel?orderId=${order._id}`
    });

    return {
      sessionId: session.id,
      paymentUrl: session.url,
      transactionId: session.id
    };
  }

  verifyWebhookSignature({ payload, signature }) {
    if (!this.stripe) {
      throw ApiError.internal('Stripe client is not initialized');
    }
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', err);
      throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
    }
  }

  async handleWebhookEvent(event) {
    let orderId = null;
    let status = null;
    let transactionId = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        orderId = session.metadata?.orderId || session.client_reference_id;
        status = 'PAID';
        transactionId = session.payment_intent || session.id;
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        orderId = intent.metadata?.orderId;
        status = 'FAILED';
        transactionId = intent.id;
        break;
      }
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    return { orderId, status, transactionId, raw: event };
  }

  async processRefund({ transactionId, amount, reason }) {
    if (!this.stripe) {
      throw ApiError.internal('Stripe client not initialized');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason ? 'requested_by_customer' : undefined
    });

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    };
  }
}

module.exports = StripeProvider;
