const StripeProvider = require('./stripe.provider');
const PaymobProvider = require('./paymob.provider');
const CodProvider = require('./cod.provider');
const ApiError = require('../../utils/apiError');

class PaymentFactory {
  constructor() {
    this.providers = {
      STRIPE: new StripeProvider(),
      PAYMOB: new PaymobProvider(),
      COD: new CodProvider()
    };
  }

  getProvider(method) {
    const provider = this.providers[method?.toUpperCase()];
    if (!provider) {
      throw ApiError.badRequest(`Unsupported payment method: ${method}`);
    }
    return provider;
  }
}

module.exports = new PaymentFactory();
