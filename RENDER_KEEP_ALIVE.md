# Render Anti-Sleep & 24/7 Always-Active System

## Overview
Render's free web services automatically spin down (sleep) after **15 minutes** of no incoming HTTP traffic. Once asleep, a cold start takes 50–60 seconds, which can make initial requests seem unresponsive.

To guarantee that the backend **never sleeps and stays active 24/7**, a multi-tiered keep-alive architecture is implemented:

---

## Layer 1: Built-In Internal Anti-Sleep Engine (`backend/lib/keepAlive.ts`)
- Automatically boots on startup with `npm start`.
- Sends an immediate warm-up request after **10 seconds** of boot.
- Pings the public endpoints (`https://ksoshtc-platform.onrender.com/api/ping` and `/health`) every **3 minutes** (safely beating Render's 15-minute idle limit).
- If any ping times out or encounters a network glitch, it automatically schedules an immediate retry within **30 seconds**.

---

## Layer 2: Client-Side Active Visitor Heartbeat (`clients/App.tsx`)
- When any visitor, student, or administrator visits `https://kigalisafetytraining.com`:
  - An immediate background request is dispatched to `/api/ping` and `/health`.
  - While the tab remains open, a continuous heartbeat ping fires every **2 minutes**.
  - Keeps the backend warm and active throughout user sessions.

---

## Layer 3: GitHub Actions 24/7 Cloud Watchdog (`.github/workflows/backend-keep-alive.yml`)
- Runs independently on GitHub's cloud infrastructure every **5 minutes** (`*/5 * * * *`).
- Sends an external HTTPS GET request to `https://ksoshtc-platform.onrender.com/health`.
- Operates 24 hours a day, 7 days a week, 365 days a year without needing any local computer or browser to be running.
- If Render is ever asleep or restarting after a deployment, this external request immediately wakes it up and keeps it alive.

---

## Layer 4 (Optional Extra): Free External Web Monitors
You can also attach free uptime monitors for external status notifications:
1. **Cron-job.org** (100% Free):
   - URL: `https://ksoshtc-platform.onrender.com/health`
   - Schedule: Every 5 or 10 minutes.
2. **UptimeRobot** (100% Free):
   - URL: `https://ksoshtc-platform.onrender.com/health`
   - Interval: Every 5 minutes.
