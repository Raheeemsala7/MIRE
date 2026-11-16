const mongoose = require('mongoose');

const ConversationStatuses = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED'
};

const conversationSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
      required: true,
      index: true
    },
    externalUserId: {
      type: String, // WhatsApp Phone Number, IG Scoped ID, FB Page-Scoped ID
      required: true,
      index: true
    },
    customerName: {
      type: String,
      default: 'Guest Customer'
    },
    customerPhone: {
      type: String,
      default: ''
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ConversationStatuses),
      default: ConversationStatuses.OPEN,
      index: true
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    unreadCount: {
      type: Number,
      default: 0
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastMessageText: {
      type: String,
      default: ''
    },
    tags: [String],
    internalNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    linkedOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      }
    ]
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ platform: 1, externalUserId: 1 }, { unique: true });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Conversation, ConversationStatuses };
