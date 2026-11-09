import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  createCheckoutSession,
  constructWebhookEvent,
  handleStripeEvent,
} from '../services/stripe.js';
import { log } from '../utils/logger.js';

const router = Router();

router.post('/checkout', authRequired, async (req, res, next) => {
  try {
    const { plan } = req.body || {};
    if (!['starter', 'growth', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Choose a valid plan' });
    }
    res.json(await createCheckoutSession({ user: req.user, plan }));
  } catch (e) {
    next(e);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const event = constructWebhookEvent(req.body, req.headers['stripe-signature']);
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (e) {
    log.error('Stripe webhook rejected', e.message);
    res.status(400).json({ error: `Webhook Error: ${e.message}` });
  }
});

export default router;