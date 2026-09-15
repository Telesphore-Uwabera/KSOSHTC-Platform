# Render Free Tier Anti-Sleep Guide (Zero-Downtime Keep-Alive)

## Problem Overview
Render's Free Web Service tier automatically spins down (enters sleep mode) after **15 minutes of inactivity** (no incoming HTTP requests).
When a visitor opens the website after the backend has slept, the initial cold start can take **50 seconds or more** to wake up.

---

## Solution 1: Automated Built-In Self-Pinger (Already Active)
The backend now includes a self-pinging background worker in `backend/lib/keepAlive.ts`:
- Automatically triggers when running in production or when `RENDER=true` / `NODE_ENV=production`.
- Sends an HTTP/HTTPS GET request to `https://ksoshtc-platform.onrender.com/api/ping` every **12 minutes** (safely before the 15-minute timeout).
- Keeps the application active and warm automatically.

### Environment Variables (Optional Customization in Render Dashboard):
- `RENDER_EXTERNAL_URL`: Set to your Render service URL (e.g. `https://ksoshtc-platform.onrender.com`). Render usually sets this automatically.
- `KEEP_ALIVE_INTERVAL_MINUTES`: Default is `12`.
- `KEEP_ALIVE`: Set to `true` to force-enable even in staging/development.

---

## Solution 2: Free External Pinger (100% Guaranteed Fail-Safe)
If the Node server ever crashes or is restarted during an update, an external monitor guarantees that Render immediately wakes up and stays awake 24/7 without fail.

You can set this up for free in 1 minute using **cron-job.org** or **UptimeRobot**:

### Option A: Using cron-job.org (Recommended - Free)
1. Go to [https://cron-job.org](https://cron-job.org) and create a free account.
2. Click **Create Cronjob**.
3. **Title**: `KSOSHTC Render Keep-Alive`
4. **URL**: `https://ksoshtc-platform.onrender.com/health` (or `https://ksoshtc-platform.onrender.com/api/ping`)
5. **Execution Schedule**: Choose **Every 10 minutes** (or `*/10 * * * *`).
6. Click **Create**.
7. Done! Your Render backend will now be continuously kept awake.

### Option B: Using UptimeRobot (Free)
1. Go to [https://uptimerobot.com](https://uptimerobot.com) and sign up for free.
2. Click **Add New Monitor**.
3. **Monitor Type**: `HTTP(s)`
4. **Friendly Name**: `KSOSHTC API`
5. **URL**: `https://ksoshtc-platform.onrender.com/health`
6. **Monitoring Interval**: `5 minutes` (or `10 minutes`).
7. Click **Create Monitor**.
