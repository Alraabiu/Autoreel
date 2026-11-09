import dns from 'node:dns';
// Force Node.js to use Google's public DNS to fix the ECONNREFUSED querySrv bug on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './services/scheduler.js';
import { log } from './utils/logger.js';

import authRoutes from './routes/auth.routes.js';
import youtubeRoutes from './routes/youtube.routes.js';
import preferencesRoutes from './routes/preferences.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import billingRoutes from './routes/billing.routes.js';
import reviewRoutes from './routes/review.routes.js';

const app = express();

app.use(helmet());

// Dynamic CORS setup to allow local development, production, and Vercel preview URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  env.CLIENT_URL // Your main Vercel URL defined in Render environment variables
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Allow any Vercel deployment URL (production or preview) or explicitly allowed origins
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Stripe requires the untouched raw request body for signature verification.
// This MUST be placed before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/review', reviewRoutes);

app.use(errorHandler);

await connectDB();

// Render requires binding to 0.0.0.0 and using the PORT provided by the environment
const PORT = process.env.PORT || env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () =>
  log.info(`AutoReel API listening on port ${PORT}`)
);

startScheduler();

process.on('SIGTERM', () => server.close(() => process.exit(0)));

export default app;