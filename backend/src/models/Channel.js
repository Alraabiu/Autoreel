import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channelId: { type: String, required: true },
    title: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    encryptedAccessToken: { type: String, required: true },
    encryptedRefreshToken: { type: String, required: true },
    tokenExpiresAt: Date,
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

channelSchema.index({ user: 1, channelId: 1 }, { unique: true });

export default mongoose.model('Channel', channelSchema);