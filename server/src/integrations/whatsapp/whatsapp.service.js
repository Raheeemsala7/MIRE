const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

class WhatsAppService {
  constructor() {
    this.accessToken = env.META.ACCESS_TOKEN;
    this.phoneNumberId = env.META.WHATSAPP_PHONE_NUMBER_ID;
    this.graphVersion = 'v20.0';
    this.baseUrl = `https://graph.facebook.com/${this.graphVersion}`;
  }

  /**
   * Send WhatsApp text message using Cloud API
   */
  async sendTextMessage(to, text) {
    if (!this.accessToken || this.accessToken === 'dummy_meta_access_token') {
      logger.info(`[MOCK WHATSAPP] To: ${to}, Message: ${text}`);
      return { messages: [{ id: `wamid.mock_${Date.now()}` }] };
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: true, body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Send WhatsApp media message (image/document)
   */
  async sendMediaMessage(to, mediaUrl, caption = '', mediaType = 'image') {
    if (!this.accessToken || this.accessToken === 'dummy_meta_access_token') {
      logger.info(`[MOCK WHATSAPP MEDIA] To: ${to}, Media: ${mediaUrl}`);
      return { messages: [{ id: `wamid.mock_${Date.now()}` }] };
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: mediaType,
      [mediaType]: { link: mediaUrl, ...(caption && { caption }) }
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }
}

module.exports = new WhatsAppService();
