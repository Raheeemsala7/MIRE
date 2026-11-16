const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

class FacebookService {
  constructor() {
    this.accessToken = env.META.ACCESS_TOKEN;
    this.graphVersion = 'v20.0';
    this.baseUrl = `https://graph.facebook.com/${this.graphVersion}`;
  }

  async sendTextMessage(recipientId, text) {
    if (!this.accessToken || this.accessToken === 'dummy_meta_access_token') {
      logger.info(`[MOCK FACEBOOK] Recipient: ${recipientId}, Text: ${text}`);
      return { message_id: `fb.mock_${Date.now()}` };
    }

    const url = `${this.baseUrl}/me/messages`;
    const response = await axios.post(
      url,
      {
        recipient: { id: recipientId },
        message: { text }
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
}

module.exports = new FacebookService();
