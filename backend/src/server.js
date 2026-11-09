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
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// Stripe requires the untouched raw request body for signature verification.
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

const server = app.listen(Number(env.PORT), () =>
  log.info(`AutoReel API listening on port ${env.PORT}`)
);

startScheduler();

process.on('SIGTERM', () => server.close(() => process.exit(0)));

export default app;