import { Router } from 'express';
import mongoose from 'mongoose';
import { authRequired } from '../middleware/auth.js';
import Video from '../models/Video.js';

const router = Router();

router.get('/pending', authRequired, async (req, res, next) => {
  try {
    res.json(
      await Video.find({
        user: req.user._id,
        status: 'ready',
        requiresReview: true,
        reviewedAt: null,
      })
        .sort({ scheduledTime: 1 })
        .select('title description script status scheduledTime cost')
    );
  } catch (e) {
    next(e);
  }
});

router.post('/:id/approve', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    const v = await Video.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: 'ready',
        requiresReview: true,
        reviewedAt: null,
      },
      { $set: { reviewedAt: new Date(), reviewedBy: req.user._id } },
      { new: true }
    );
    if (!v) return res.status(404).json({ error: 'Pending review video not found' });
    res.json({ ok: true, video: v });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reject', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    const v = await Video.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: 'ready',
        requiresReview: true,
        reviewedAt: null,
      },
      { $set: { status: 'failed', error: 'Rejected by user' } },
      { new: true }
    );
    if (!v) return res.status(404).json({ error: 'Pending review video not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;