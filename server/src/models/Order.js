const mongoose = require('mongoose');

const OrderStatuses = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  CUSTOMER_NOT_RESPONDING: 'CUSTOMER_NOT_RESPONDING',
  FAILED_DELIVERY: 'FAILED_DELIVERY'
};

const PaymentMethods = {
  COD: 'COD',
  STRIPE: 'STRIPE',
  PAYMOB: 'PAYMOB'
};

const PaymentStatuses = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
};

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const deliveryAttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ['NO_ANSWER', 'CUSTOMER_REFUSED', 'RESCHEDULED', 'CUSTOMER_CONFIRMED', 'FAILED'],
    required: true
  },
  notes: { type: String, default: '' },
  attemptedAt: { type: Date, default: Date.now },
  attemptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(OrderStatuses),
    required: true
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const internalNoteSchema = new mongoose.Schema({
  note: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    customerInfo: {
      fullName: { type: String, required: true },
      email: { type: String },
      phone: { type: String, required: true, index: true },
      secondaryPhone: { type: String }
    },
    shippingAddress: {
      street: { type: String, required: true },
      building: { type: String },
      apartment: { type: String },
      city: { type: String, required: true },
      governorate: { type: String, required: true },
      postalCode: { type: String },
      country: { type: String, default: 'Egypt' },
      landmark: { type: String },
      latitude: { type: Number },
      longitude: { type: Number }
    },
    items: [orderItemSchema],
    pricing: {
      subtotal: { type: Number, required: true },
      bundleDiscount: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      shippingFee: { type: Number, required: true, default: 0 },
      totalAmount: { type: Number, required: true }
    },
    paymentInfo: {
      method: {
        type: String,
        enum: Object.values(PaymentMethods),
        default: PaymentMethods.COD
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatuses),
        default: PaymentStatuses.PENDING,
        index: true
      },
      transactionId: { type: String },
      paidAt: { type: Date }
    },
    status: {
      type: String,
      enum: Object.values(OrderStatuses),
      default: OrderStatuses.NEW,
      index: true
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    orderNotes: {
      type: String,
      default: ''
    },
    internalNotes: [internalNoteSchema],
    statusHistory: [statusHistorySchema],
    deliveryAttempts: [deliveryAttemptSchema],
    source: {
      type: String,
      enum: ['WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'MANUAL'],
      default: 'WEBSITE'
    },
    sourceConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1, orderNumber: 1 });
orderSchema.index({ 'pricing.totalAmount': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = { Order, OrderStatuses, PaymentMethods, PaymentStatuses };
