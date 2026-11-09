import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  getAuthUrl,
  exchangeCodeForTokens,
  saveChannelForUser,
} from '../services/youtube.js';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

const router = Router();

router.get('/auth-url', authRequired, (req, res, next) => {
  try {
    res.json({ url: getAuthUrl(String(req.user._id)) });
  } catch (e) {
    next(e);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(
        `${env.CLIENT_URL}/onboarding?error=${encodeURIComponent(String(error))}`
      );
    }
    if (!code || !state || !/^[a-f\d]{24}$/i.test(String(state))) {
      return res.redirect(`${env.CLIENT_URL}/onboarding?error=invalid_oauth_state`);
    }
    const { tokens, channel } = await exchangeCodeForTokens(String(code));
    await saveChannelForUser(String(state), tokens, channel);
    return res.redirect(`${env.CLIENT_URL}/onboarding?connected=1`);
  } catch (e) {
    log.error('YouTube OAuth callback failed', e.message);
    return res.redirect(`${env.CLIENT_URL}/onboarding?error=connection_failed`);
  }
});

export default router;