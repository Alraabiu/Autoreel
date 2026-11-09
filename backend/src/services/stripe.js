import Stripe from 'stripe';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { log } from '../utils/logger.js';

let stripeClient;

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
  if (!stripeClient) stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  return stripeClient;
}

const priceMap = {
  starter: env.STRIPE_PRICE_STARTER,
  growth: env.STRIPE_PRICE_GROWTH,
  pro: env.STRIPE_PRICE_PRO,
};

export async function createCheckoutSession({ user, plan }) {
  if (!Object.hasOwn(priceMap, plan) || !priceMap[plan]) {
    throw new Error(`Stripe price is not configured for plan: ${plan}`);
  }
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceMap[plan], quantity: 1 }],
    customer_email: user.email,
    client_reference_id: String(user._id),
    metadata: { userId: String(user._id), plan },
    subscription_data: { metadata: { userId: String(user._id), plan } },
    success_url: `${env.CLIENT_URL}/dashboard?paid=1`,
    cancel_url: `${env.CLIENT_URL}/dashboard`,
  });
  return { url: session.url };
}

export async function handleStripeEvent(event) {
  const obj = event.data?.object;

  if (event.type === 'checkout.session.completed') {
    const userId = obj.metadata?.userId || obj.client_reference_id;
    const plan = obj.metadata?.plan;
    const counts = { starter: 1, growth: 3, pro: 3 };
    if (!userId || !counts[plan]) {
      log.warn('Checkout completed with missing user/plan metadata');
      return;
    }
    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: obj.customer,
      stripeSubscriptionId: obj.subscription,
      plan,
      subscriptionStatus: 'active',
      videosPerDay: counts[plan],
    });
  } else if (event.type === 'customer.subscription.updated') {
    const sub = obj;
    const status =
      sub.status === 'active'
        ? 'active'
        : sub.status === 'past_due'
        ? 'past_due'
        : sub.status === 'canceled'
        ? 'canceled'
        : 'inactive';
    const update = { subscriptionStatus: status };
    if (status === 'canceled') Object.assign(update, { plan: 'none', videosPerDay: 0 });
    await User.findOneAndUpdate({ stripeSubscriptionId: sub.id }, update);
  } else if (event.type === 'customer.subscription.deleted') {
    await User.findOneAndUpdate(
      { stripeSubscriptionId: obj.id },
      { subscriptionStatus: 'canceled', plan: 'none', videosPerDay: 0 }
    );
  }
}

export function constructWebhookEvent(rawBody, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}