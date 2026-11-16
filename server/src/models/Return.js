const mongoose = require('mongoose');

const ReturnStatuses = {
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURN_APPROVED: 'RETURN_APPROVED',
  PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
  PICKED_UP: 'PICKED_UP',
  RECEIVED: 'RECEIVED',
  INSPECTED: 'INSPECTED',
  REFUNDED: 'REFUNDED',
  REJECTED: 'REJECTED'
};

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  condition: {
    type: String,
    enum: ['UNOPENED', 'TAGS_ATTACHED', 'WORN', 'DAMAGED', 'DEFECTIVE', 'PENDING_INSPECTION'],
    default: 'PENDING_INSPECTION'
  },
  restockApproved: {
    type: Boolean,
    default: false
  },
  restockedAt: {
    type: Date,
    default: null
  }
});

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    originalOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      enum: [
        'SIZE_TOO_SMALL',
        'SIZE_TOO_LARGE',
        'NOT_AS_PICTURED',
        'DEFECTIVE',
        'CHANGED_MIND',
        'WRONG_ITEM_SENT',
        'OTHER'
      ],
      required: true
    },
    reasonDetails: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(ReturnStatuses),
      default: ReturnStatuses.RETURN_REQUESTED,
      index: true
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    refundMethod: {
      type: String,
      enum: ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'CASH', 'WALLET'],
      default: 'CASH'
    },
    refundStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING'
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    internalNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    inspectionNotes: {
      type: String,
      default: ''
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    inspectedAt: {
      type: Date,
      default: null
    },
    callAttempts: [
      {
        attemptNumber: { type: Number, required: true },
        result: {
          type: String,
          enum: ['NO_ANSWER', 'CUSTOMER_REFUSED', 'CUSTOMER_CONFIRMED', 'RESCHEDULED'],
          required: true
        },
        notes: String,
        attemptedAt: { type: Date, default: Date.now },
        attemptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

returnSchema.index({ status: 1, createdAt: -1 });

const Return = mongoose.model('Return', returnSchema);

module.exports = { Return, ReturnStatuses };
