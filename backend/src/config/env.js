import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || '4000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:4000',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/youtube/callback',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || '',
  STRIPE_PRICE_GROWTH: process.env.STRIPE_PRICE_GROWTH || '',
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || '',
  VIDEO_TMP_DIR: process.env.VIDEO_TMP_DIR || '/tmp/autoreel',
  VIDEO_OUTPUT_DIR: process.env.VIDEO_OUTPUT_DIR || './storage/videos',
};

for (const key of ['MONGODB_URI', 'JWT_SECRET', 'TOKEN_ENCRYPTION_KEY']) {
  if (!env[key] || (key === 'TOKEN_ENCRYPTION_KEY' && !/^[a-fA-F0-9]{64}$/.test(env[key]))) {
    console.error(`Missing or invalid required environment variable: ${key}`);
    process.exit(1);
  }
}