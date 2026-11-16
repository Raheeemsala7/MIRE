const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
      required: true,
      index: true
    },
    accountName: {
      type: String,
      required: true
    },
    identifier: {
      type: String, // Phone Number ID for WhatsApp, Page ID for FB/IG
      required: true,
      unique: true
    },
    wabaId: {
      type: String, // WhatsApp Business Account ID
      default: ''
    },
    accessToken: {
      type: String,
      required: true,
      select: false // Never leak access tokens by default
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED'],
      default: 'CONNECTED',
      index: true
    },
    webhookSecret: {
      type: String,
      default: ''
    },
    metaConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);

module.exports = SocialAccount;
