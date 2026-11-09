import axios from 'axios';
import { env } from '../config/env.js';

const paystackAPI = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function initializeTransaction({ email, planCode, callbackUrl, metadata }) {
  const response = await paystackAPI.post('/transaction/initialize', {
    email,
    plan: planCode,
    callback_url: callbackUrl,
    metadata,
  });
  return response.data.data.authorization_url;
}

export const priceMap = {
  starter: env.PAYSTACK_PRICE_STARTER,
  growth: env.PAYSTACK_PRICE_GROWTH,
  pro: env.PAYSTACK_PRICE_PRO,
};