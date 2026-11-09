import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => res.json(req.user.preferences));

router.put('/', authRequired, async (req, res, next) => {
  try {
    const p = req.body || {};
    const allowed = {
      niche: ['motivation', 'tech', 'facts', 'history', 'stories', 'other', ''],
      videoStyle: ['stickman', 'cinematic', 'stock_captions', 'animated_images', ''],
      voiceGender: ['male', 'female', ''],
      voiceTone: ['calm', 'energetic', ''],
    };
    for (const [key, values] of Object.entries(allowed)) {
      if (p[key] !== undefined && !values.includes(p[key])) {
        return res.status(400).json({ error: `Invalid ${key}` });
      }
    }

    const pref = req.user.preferences;
    for (const key of [
      'niche',
      'videoStyle',
      'voiceGender',
      'voiceTone',
      'language',
      'exampleChannel',
      'requireReview',
    ]) {
      if (p[key] !== undefined) pref[key] = p[key];
    }

    if (p.avoidTopics !== undefined) {
      pref.avoidTopics = Array.isArray(p.avoidTopics)
        ? p.avoidTopics.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 50)
        : String(p.avoidTopics)
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 50);
    }

    pref.onboardingComplete = Boolean(
      pref.niche && pref.videoStyle && pref.voiceGender && pref.voiceTone
    );
    if (pref.onboardingComplete && req.user.plan !== 'none') {
      req.user.videosPerDay = req.user.plan === 'starter' ? 1 : 3;
    }

    await req.user.save();
    res.json(req.user.toSafeJSON());
  } catch (e) {
    next(e);
  }
});

export default router;