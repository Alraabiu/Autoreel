# AutoReel

AutoReel is a full-stack subscription SaaS starter for generating faceless YouTube videos from a user's content preferences and uploading them to their connected channel. It includes a React dashboard, Express/MongoDB API, Google OAuth, Stripe subscription webhook, AI generation providers, FFmpeg rendering, a scheduler, and an approval queue.

> **Production note:** This is a runnable foundation, not a substitute for production security, legal review, load testing, Google OAuth verification, or a YouTube API quota review. Provider costs and API behavior change. Do not promise fully autonomous publishing until you have tested the entire pipeline with your own credentials and a private/test channel. The sample video embeds on the landing page are replaceable examples.

## Features

- Email/password authentication with bcrypt and 7-day JWTs.
- Google OAuth channel connection; access and refresh tokens encrypted at rest using AES-256-GCM.
- Unique daily slot keys per channel and channel-seeded script generation.
- Stripe Checkout subscriptions: Starter ($39/month, 1 video/day), Growth ($89/month, 3/day), Pro ($149/month, 3/day).
- Subscription activation only from a verified Stripe webhook.
- Optional approval queue before a video can upload.
- OpenAI script generation and TTS, Gemini image generation, FFmpeg/ffprobe vertical-video pipeline.
- Scheduled planning, generation, uploads, dashboard, privacy and terms pages.

## Prerequisites

- Node.js 18+ (Node 20 or 22 recommended).
- MongoDB running locally or a MongoDB Atlas URI.
- FFmpeg and FFprobe installed and available on `PATH` (`ffmpeg -version`, `ffprobe -version`).
- Google Cloud project with YouTube Data API v3 enabled and OAuth consent configured.
- OpenAI API key, Gemini API key, and Stripe account/API keys for live generation and billing.

## Setup

### 1. Backend

```bash
cd Autoreel/backend
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed. Edit `.env` before starting. Generate a 32-byte hex encryption key with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set that value as `TOKEN_ENCRYPTION_KEY`. Use a long random `JWT_SECRET`. Keep `.env` private and never commit it. The backend listens on `http://localhost:4000` by default; health check: `http://localhost:4000/api/health`.

### 2. Frontend

In a second terminal:

```bash
cd Autoreel/frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend. If the frontend is deployed separately, set `VITE_API_URL` to the backend origin and configure CORS appropriately.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Backend HTTP port (default 4000) |
| `NODE_ENV` | Runtime environment |
| `CLIENT_URL` | Frontend origin for CORS and OAuth redirects |
| `SERVER_URL` | Public backend origin |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign session JWTs |
| `TOKEN_ENCRYPTION_KEY` | Exactly 64 hexadecimal characters (32 bytes) for AES-256-GCM |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GOOGLE_REDIRECT_URI` | Must exactly match the redirect URI configured in Google Cloud |
| `OPENAI_API_KEY` | OpenAI script and speech generation |
| `GEMINI_API_KEY` | Gemini image generation |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe endpoint signing secret |
| `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO` | Stripe recurring monthly Price IDs (not product IDs) |
| `VIDEO_TMP_DIR` | Temporary render workspace |
| `VIDEO_OUTPUT_DIR` | Persistent location for generated MP4s |
| `VITE_API_URL` | Optional frontend API base URL |

## Google OAuth setup

1. Enable YouTube Data API v3 in Google Cloud.
2. Configure the OAuth consent screen and add authorized test users while in testing mode.
3. Add `http://localhost:4000/api/youtube/callback` as an authorized redirect URI.
4. Put the client ID and secret in backend `.env`.
5. For public use, complete Google's required verification and accurately describe data use. The application requests YouTube upload/read-only and profile scopes.

The callback uses the authenticated user's MongoDB ID as OAuth `state` and validates its ObjectId shape. For a production deployment, replace this with a short-lived, signed, single-use state record tied to the initiating session to provide CSRF protection; do not treat the current state validation alone as sufficient production OAuth protection.

## Stripe setup and webhook testing

Create monthly recurring Stripe prices for the three plans and put their **Price IDs** in `.env`. Configure the webhook endpoint as `/api/billing/webhook` for checkout completion and subscription update/deletion events. The webhook route is mounted with `express.raw()` before JSON parsing so Stripe signature verification can work.

Install the Stripe CLI, log in, and run:

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

Copy the CLI-provided webhook signing secret into `STRIPE_WEBHOOK_SECRET`. Use Stripe test keys and test cards before enabling live billing. A successful checkout redirect does **not** activate a plan; only the verified webhook does.

## How the video pipeline works

1. The scheduler runs every 10 minutes and plans unique daily slots for active subscribers with completed onboarding and connected channels.
2. A queued slot is atomically claimed and marked `generating`.
3. OpenAI generates a title, script, and description using preferences plus the channel ID seed. Gemini generates four vertical images. OpenAI TTS generates the narration.
4. FFprobe determines narration duration. FFmpeg adds slow zooms, combines images, burns in timed four-word captions, encodes a 1080×1920 H.264/AAC MP4, and saves it under `VIDEO_OUTPUT_DIR`.
5. Videos become `ready`. If review is enabled, they wait for approval; otherwise, they can upload when their scheduled time is due.
6. YouTube Data API uploads the MP4 and the dashboard records the returned video ID.

Generated files need persistent storage in production. If a video fails, inspect its error in the dashboard and backend logs. The current scheduler marks failures rather than retrying indefinitely.

## Approximate cost per video

The estimate in code is approximately **$0.22 per video** using four images at $0.039 each ($0.156), a nominal $0.0002 text estimate, and TTS at $0.015 per 1,000 characters (around $0.06 for 4,000 characters). Actual costs vary by model, output length, provider pricing, retries, and image settings. This estimate excludes hosting, storage, Stripe fees, taxes, and support. Verify current provider pricing before setting margins.

## YouTube quota awareness

The scheduler logs a warning when a channel exceeds five successful uploads in the last 24 hours. YouTube's default quota and upload cost can change and may be shared across the Google Cloud project; do not assume a fixed daily allowance. Review the current YouTube Data API quota documentation and request a quota increase where eligible. Three uploads per day per customer can exceed a project's limits as customers grow.

## Deployment notes

- **Backend:** Render or Railway with Node.js, FFmpeg and FFprobe installed in the runtime/build image. Configure all environment variables and a persistent disk/volume for video output. Confirm the host permits long-running FFmpeg processes and scheduled jobs. Run a single scheduler instance unless you add distributed locking.
- **Frontend:** Vercel or another static host; run `npm run build` and publish `frontend/dist`. Set `VITE_API_URL` to the backend public URL and configure backend CORS.
- **Database:** MongoDB Atlas with network access restricted to your backend. Create backups and monitor indexes.
- **Storage:** Replace local `VIDEO_OUTPUT_DIR` with durable object storage for multi-instance production. The current code stores file paths in MongoDB and expects the upload worker to access those files.
- **Security:** Use HTTPS, a strong JWT secret and encryption key, a production OAuth state store, rate limiting, account deletion/export workflows, structured monitoring, secrets management, and reviewed legal terms. Do not log tokens. Restrict uploads to verified account owners.
- **OAuth verification:** Privacy/terms pages are included as a starting point. Ensure the published policy and actual behavior accurately match Google's requirements and your deployment.

## Useful commands

```bash
# backend
cd Autoreel/backend && npm install && npm run dev

# frontend
cd Autoreel/frontend && npm install && npm run dev

# production frontend build
cd Autoreel/frontend && npm run build
```

## Important implementation boundaries

- The Pro plan advertises multi-channel support, and the data model/scheduler supports multiple connected channels; the dashboard currently displays the most recently connected channel as a summary.
- Google OAuth access/refresh tokens are encrypted; token encryption key rotation requires a migration strategy.
- The scheduler is process-local. For multiple backend instances, use a distributed queue/lock and a dedicated worker.
- The example does not include a full billing portal, cancellation UI, email verification, password reset, admin tooling, or account deletion UI. Add these before operating a commercial production service.
