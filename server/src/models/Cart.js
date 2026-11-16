const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantSku: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
    default: null
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    guestId: {
      type: String,
      default: null,
      index: true
    },
    items: [cartItemSchema],
    appliedBundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bundle',
      default: null
    },
    appliedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    },
    governorate: {
      type: String,
      default: 'Cairo'
    },
    subtotal: {
      type: Number,
      default: 0
    },
    bundleDiscount: {
      type: Number,
      default: 0
    },
    couponDiscount: {
      type: Number,
      default: 0
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

cartSchema.index({ user: 1, guestId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
