const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['STRIPE', 'PAYMOB', 'COD'],
      required: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'EGP',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
      index: true
    },
    paymentMethodDetails: {
      cardBrand: String,
      last4: String,
      walletNumber: String
    },
    refundDetails: {
      refundId: String,
      refundAmount: Number,
      reason: String,
      refundedAt: Date
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

paymentTransactionSchema.index({ order: 1, provider: 1, status: 1 });

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = PaymentTransaction;
