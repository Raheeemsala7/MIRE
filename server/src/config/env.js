const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mire_ecommerce',

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'mire_jwt_access_super_secret_key_development_2026_x987',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'mire_jwt_refresh_super_secret_key_development_2026_z123',
    ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '7d',
    REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '30d'
  },

  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(','),

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || ''
  },

  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  PAYMOB: {
    API_KEY: process.env.PAYMOB_API_KEY || '',
    INTEGRATION_ID: process.env.PAYMOB_INTEGRATION_ID || '',
    IFRAME_ID: process.env.PAYMOB_IFRAME_ID || '',
    HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET || ''
  },

  DAFTAR_CASH: {
    API_KEY:
      process.env.DAFTAR_CASH_API_KEY ||
      'vc_test_b65811ae2dfb0a4f1c289849e5382e5b192e36173ff2cd21',
    WEBHOOK_SECRET:
      process.env.DAFTAR_CASH_WEBHOOK_SECRET ||
      'd04e6b2323c8e70693dce6b423458b358e143da8998390707f6126b072467ea8',
    BASE_URL: process.env.DAFTAR_CASH_BASE_URL || 'https://daftarcash.com'
  },

  META: {
    APP_ID: process.env.META_APP_ID || '',
    APP_SECRET: process.env.META_APP_SECRET || '',
    ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
    VERIFY_TOKEN: process.env.META_VERIFY_TOKEN || 'mire_meta_verify_token_2026_secure',
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
  },

  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000
  }
};

module.exports = env;
