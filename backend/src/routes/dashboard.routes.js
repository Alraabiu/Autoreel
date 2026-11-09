import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Channel from '../models/Channel.js';
import Video from '../models/Video.js';

const router = Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const [channel, totalPosted, recentVideos] = await Promise.all([
      Channel.findOne({ user: req.user._id })
        .sort({ connectedAt: -1 })
        .select('channelId title thumbnail connectedAt'),
      Video.countDocuments({ user: req.user._id, status: 'posted' }),
      Video.find({ user: req.user._id })
        .sort({ scheduledTime: -1 })
        .limit(20)
        .select(
          'title description status scheduledTime postedAt youtubeVideoId error requiresReview reviewedAt cost'
        ),
    ]);
    res.json({
      channel,
      plan: req.user.plan,
      subscriptionStatus: req.user.subscriptionStatus,
      videosPerDay: req.user.videosPerDay,
      totalPosted,
      recentVideos,
    });
  } catch (e) {
    next(e);
  }
});

export default router;