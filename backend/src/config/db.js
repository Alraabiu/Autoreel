import mongoose from 'mongoose';
import { env } from './env.js';
import { log } from '../utils/logger.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    log.info('MongoDB connected');
  } catch (err) {
    log.error('MongoDB connection failed', err.message);
    process.exit(1);
  }
}