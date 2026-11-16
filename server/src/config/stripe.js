const Stripe = require('stripe');
const env = require('./env');

const stripe = env.STRIPE.SECRET_KEY ? new Stripe(env.STRIPE.SECRET_KEY, { apiVersion: '2023-10-16' }) : null;

module.exports = stripe;
