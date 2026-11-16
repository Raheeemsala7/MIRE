const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    platform: {
      type: String,
      enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['INCOMING', 'OUTGOING'],
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    recipientId: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'TEMPLATE'],
      default: 'TEXT'
    },
    content: {
      type: String,
      default: ''
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    mediaType: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'SENT'
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    externalMessageId: {
      type: String,
      index: true
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
