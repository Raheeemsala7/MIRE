const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['NEW_ORDER', 'ORDER_STATUS_UPDATE', 'NEW_MESSAGE', 'LOW_STOCK', 'NEW_RETURN', 'SYSTEM'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    recipientRole: {
      type: String,
      default: null // null means all staff or specific role e.g. ORDER_MANAGER
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    entityType: {
      type: String,
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
