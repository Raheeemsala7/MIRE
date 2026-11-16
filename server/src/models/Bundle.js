const mongoose = require('mongoose');

const BundleTypes = {
  FIXED_PRICE: 'FIXED_PRICE', // e.g. 2 items for 599 EGP
  BUY_X_GET_Y: 'BUY_X_GET_Y', // e.g. Buy 2 Get 1 Free
  PERCENTAGE: 'PERCENTAGE', // e.g. 25% off when buying 3 items
  COLLECTION_PICK: 'COLLECTION_PICK' // Select any X products from a defined collection for a fixed price
};

const bundleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Bundle title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: Object.values(BundleTypes),
      required: true
    },
    eligibleProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
      }
    ],
    eligibleCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true
      }
    ],
    requiredQuantity: {
      type: Number,
      required: [true, 'Required item quantity is required'],
      min: [1, 'Minimum required quantity is 1']
    },
    freeQuantity: {
      type: Number,
      default: 0
    },
    bundlePrice: {
      type: Number,
      default: null,
      min: 0
    },
    discountPercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usedCount: {
      type: Number,
      default: 0
    },
    maxUsesPerCustomer: {
      type: Number,
      default: 1
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    bannerImage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

bundleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Bundle = mongoose.model('Bundle', bundleSchema);

module.exports = { Bundle, BundleTypes };
