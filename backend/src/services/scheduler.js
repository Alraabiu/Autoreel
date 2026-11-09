import cron from 'node-cron';
import User from '../models/User.js';
import Channel from '../models/Channel.js';
import Video from '../models/Video.js';
import { generateVideo } from './videoPipeline.js';
import { uploadVideo } from './youtube.js';
import { log } from '../utils/logger.js';

let running = false;

export async function planDailySlots() {
  const users = await User.find({
    subscriptionStatus: 'active',
    videosPerDay: { $gt: 0 },
    'preferences.onboardingComplete': true,
  });
  const now = new Date();

  for (const user of users) {
    const channels = await Channel.find({ user: user._id });
    for (const channel of channels) {
      const times = user.videosPerDay === 1 ? [12] : [8, 14, 20];
      for (let i = 0; i < Math.min(user.videosPerDay, times.length); i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setHours(times[i], 0, 0, 0);
        if (scheduledTime < now) scheduledTime.setDate(scheduledTime.getDate() + 1);

        const day = scheduledTime.toISOString().slice(0, 10);
        const slotKey = `${channel.channelId}-${day}-${i}`;

        try {
          await Video.create({
            user: user._id,
            channel: channel._id,
            slotKey,
            scheduledTime,
            requiresReview: user.preferences.requireReview,
          });
        } catch (err) {
          if (err.code !== 11000) log.error('Could not plan video slot', err.message);
        }
      }
    }
  }
}

export async function generateDueVideos() {
  const now = new Date();
  const due = await Video.find({
    status: 'queued',
    scheduledTime: { $lte: new Date(now.getTime() + 60 * 60 * 1000) },
  })
    .sort({ scheduledTime: 1 })
    .limit(5);

  for (const candidate of due) {
    const video = await Video.findOneAndUpdate(
      { _id: candidate._id, status: 'queued' },
      { $set: { status: 'generating', error: '' } },
      { new: true }
    );
    if (!video) continue;

    try {
      const [user, channel] = await Promise.all([
        User.findById(video.user),
        Channel.findById(video.channel),
      ]);
      if (!user || !channel) throw new Error('Video owner or channel was not found');

      const result = await generateVideo({
        videoDoc: video,
        channel,
        preferences: user.preferences,
      });
      Object.assign(video, result, { status: 'ready' });
      await video.save();
    } catch (err) {
      video.status = 'failed';
      video.error = err.message || 'Video generation failed';
      await video.save();
      log.error('Video generation failed', String(video._id), video.error);
    }
  }
}

export async function uploadReadyVideos() {
  const now = new Date();
  const ready = await Video.find({
    status: 'ready',
    scheduledTime: { $lte: now },
    $or: [{ requiresReview: false }, { reviewedAt: { $ne: null } }],
  })
    .sort({ scheduledTime: 1 })
    .limit(5);

  for (const video of ready) {
    try {
      const channel = await Channel.findById(video.channel);
      if (!channel) throw new Error('Connected channel not found');

      const youtubeVideoId = await uploadVideo(channel, {
        filePath: video.filePath,
        title: video.title,
        description: video.description,
      });
      video.status = 'posted';
      video.youtubeVideoId = youtubeVideoId;
      video.postedAt = new Date();
      await video.save();

      const count = await Video.countDocuments({
        status: 'posted',
        postedAt: { $gte: new Date(Date.now() - 86400000) },
      });
      if (count > 5) {
        log.warn(
          `YouTube quota awareness: ${count} uploads in the last 24h across this app's Google Cloud project; verify project quota.`
        );
      }
    } catch (err) {
      video.status = 'failed';
      video.error = err.message || 'YouTube upload failed';
      await video.save();
      log.error('Video upload failed', String(video._id), video.error);
    }
  }
}

export function startScheduler() {
  if (running) return;
  running = true;
  cron.schedule('*/10 * * * *', async () => {
    try {
      await planDailySlots();
      await generateDueVideos();
      await uploadReadyVideos();
    } catch (err) {
      log.error('Scheduler cycle failed', err.stack || err.message);
    }
  });
  log.info('Video scheduler started (every 10 minutes)');
}