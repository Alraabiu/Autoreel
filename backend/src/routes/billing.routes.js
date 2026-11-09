import { Router } from 'express';
import crypto from 'node:crypto';
import { authRequired } from '../middleware/auth.js';
import { initializeTransaction, priceMap } from '../services/paystack.js';
import User from '../models/User.js';
import { log } from '../utils/logger.js';
import { env } from '../config/env.js';

const router = Router();

// 1. CHECKOUT ROUTE (Frontend calls this)
router.post('/checkout', authRequired, async (req, res, next) => {
  try {
    const { plan } = req.body || {};
    
    if (!Object.hasOwn(priceMap, plan) || !priceMap[plan]) {
      return res.status(400).json({ error: `Payment plan "${plan}" is not configured.` });
    }

    const callbackUrl = `${env.CLIENT_URL}/dashboard?paid=1`;
    
    const authorizationUrl = await initializeTransaction({
      email: req.user.email,
      planCode: priceMap[plan],
      callbackUrl,
      metadata: { userId: String(req.user._id), plan },
    });

    res.json({ url: authorizationUrl });
  } catch (e) {
    next(e);
  }
});

// 2. WEBHOOK ROUTE (Paystack calls this)
// Note: This route MUST be registered BEFORE express.json() in server.js
router.post('/webhook', async (req, res) => {
  // Verify the event is from Paystack using HMAC-SHA512
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(req.body) // req.body must be the raw Buffer
    .digest('hex');

  const signature = req.headers['x-paystack-signature'];
  if (hash !== signature) {
    log.warn('Paystack webhook signature mismatch');
    return res.status(401).send('Unauthorized');
  }

  const event = JSON.parse(req.body.toString());
  
  try {
    if (event.event === 'charge.success') {
      const { metadata } = event.data;
      const userId = metadata?.userId;
      const plan = metadata?.plan;
      const counts = { starter: 1, growth: 3, pro: 3 };

      if (userId && counts[plan]) {
        await User.findByIdAndUpdate(userId, {
          plan,
          subscriptionStatus: 'active',
          videosPerDay: counts[plan],
        });
        log.info(`User ${userId} activated on plan: ${plan}`);
      }
    }

    // Handle subscription cancellations or failures (optional)
    if (event.event === 'subscription.disable') {
       const customerCode = event.data.customer.customer_code;
       await User.findOneAndUpdate(
         { stripeCustomerId: customerCode }, // Reusing this field to store Paystack customer code
         { subscriptionStatus: 'canceled', plan: 'none', videosPerDay: 0 }
       );
    }
  } catch (err) {
    log.error('Paystack webhook processing failed', err.message);
  }

  // Always return 200 so Paystack doesn't retry unnecessarily
  res.sendStatus(200);
});

export default router;