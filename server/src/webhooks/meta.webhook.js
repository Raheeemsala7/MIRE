const env = require('../config/env');
const socialService = require('../services/social.service');
const logger = require('../utils/logger');

/**
 * Meta Webhook Verification (GET)
 * Validates hub.challenge and hub.verify_token
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === env.META.VERIFY_TOKEN) {
      logger.info('Meta webhook verified successfully');
      return res.status(200).send(challenge);
    }
    logger.warn('Meta webhook verification token mismatch');
    return res.sendStatus(403);
  }

  return res.sendStatus(400);
};

/**
 * Ingest incoming events from WhatsApp, Instagram, and Messenger (POST)
 */
const handleWebhookEvent = async (req, res) => {
  const body = req.body;

  try {
    // 1. WhatsApp Cloud API Webhook
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value && value.messages) {
            for (const msg of value.messages) {
              const senderPhone = msg.from;
              const contact = (value.contacts || []).find((c) => c.wa_id === senderPhone);
              const customerName = contact?.profile?.name || '';

              let text = '';
              let mediaUrl = '';
              let mediaType = '';

              if (msg.type === 'text') {
                text = msg.text.body;
              } else if (msg.type === 'image') {
                mediaUrl = msg.image?.id || '';
                mediaType = 'IMAGE';
                text = msg.image?.caption || '';
              } else if (msg.type === 'document') {
                mediaUrl = msg.document?.id || '';
                mediaType = 'DOCUMENT';
                text = msg.document?.caption || msg.document?.filename || '';
              }

              await socialService.handleIncomingMessage({
                platform: 'WHATSAPP',
                senderId: senderPhone,
                recipientId: value.metadata?.phone_number_id,
                text,
                mediaUrl,
                mediaType,
                raw: msg,
                customerName
              });
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 2. Instagram Messaging Webhook
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          const senderId = messaging.sender?.id;
          const recipientId = messaging.recipient?.id;
          const message = messaging.message;

          if (message) {
            await socialService.handleIncomingMessage({
              platform: 'INSTAGRAM',
              senderId,
              recipientId,
              text: message.text || '',
              mediaUrl: message.attachments?.[0]?.payload?.url || '',
              mediaType: message.attachments?.[0]?.type || '',
              raw: messaging
            });
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 3. Facebook Messenger Platform Webhook
    if (body.object === 'page') {
      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          const senderId = messaging.sender?.id;
          const recipientId = messaging.recipient?.id;
          const message = messaging.message;

          if (message) {
            await socialService.handleIncomingMessage({
              platform: 'FACEBOOK',
              senderId,
              recipientId,
              text: message.text || '',
              mediaUrl: message.attachments?.[0]?.payload?.url || '',
              mediaType: message.attachments?.[0]?.type || '',
              raw: messaging
            });
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Error handling Meta webhook event', error);
    return res.status(200).send('EVENT_RECEIVED'); // Always 200 to acknowledge Meta
  }
};

module.exports = { verifyWebhook, handleWebhookEvent };
