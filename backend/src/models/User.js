import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const preferencesSchema = new mongoose.Schema(
  {
    niche: {
      type: String,
      enum: ['motivation', 'tech', 'facts', 'history', 'stories', 'other', ''],
      default: '',
    },
    videoStyle: {
      type: String,
      enum: ['stickman', 'cinematic', 'stock_captions', 'animated_images', ''],
      default: '',
    },
    voiceGender: { type: String, enum: ['male', 'female', ''], default: '' },
    voiceTone: { type: String, enum: ['calm', 'energetic', ''], default: '' },
    language: { type: String, default: 'en' },
    avoidTopics: { type: [String], default: [] },
    exampleChannel: { type: String, default: '' },
    requireReview: { type: Boolean, default: true },
    onboardingComplete: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    plan: { type: String, enum: ['none', 'starter', 'growth', 'pro'], default: 'none' },
    subscriptionStatus: {
      type: String,
      enum: ['inactive', 'active', 'past_due', 'canceled'],
      default: 'inactive',
    },
    videosPerDay: { type: Number, default: 0 },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};

userSchema.statics.hashPassword = function (pw) {
  return bcrypt.hash(pw, 12);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    plan: this.plan,
    subscriptionStatus: this.subscriptionStatus,
    videosPerDay: this.videosPerDay,
    preferences: this.preferences,
  };
};

export default mongoose.model('User', userSchema);