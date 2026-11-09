import mongoose from 'mongoose';

const costSchema = new mongoose.Schema(
  {
    text: { type: Number, default: 0 },
    images: { type: Number, default: 0 },
    tts: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    script: { type: String, default: '' },
    filePath: String,
    durationSec: Number,
    status: {
      type: String,
      enum: ['queued', 'generating', 'ready', 'posted', 'failed'],
      default: 'queued',
      index: true,
    },
    slotKey: { type: String, unique: true, sparse: true, index: true },
    scheduledTime: { type: Date, required: true, index: true },
    postedAt: Date,
    youtubeVideoId: String,
    error: String,
    cost: { type: costSchema, default: () => ({}) },
    requiresReview: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

videoSchema.index({ status: 1, scheduledTime: 1 });
videoSchema.index({ channel: 1, createdAt: -1 });

export default mongoose.model('Video', videoSchema);