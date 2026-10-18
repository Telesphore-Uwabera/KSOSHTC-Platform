import https from "node:https";
import http from "node:http";

let keepAliveInterval: NodeJS.Timeout | null = null;
let retryTimeout: NodeJS.Timeout | null = null;

/**
 * Pings the external public URL of the backend at regular intervals
 * to prevent Render's free tier from spinning down after 15 minutes of inactivity.
 */
export function startKeepAlive(options?: {
  url?: string;
  intervalMinutes?: number;
}): void {
  // Allow disabling only if explicitly set to false
  if (process.env.KEEP_ALIVE === "false") {
    console.log("[KEEP-ALIVE] Explicitly disabled via KEEP_ALIVE=false");
    return;
  }

  // Prevent duplicate timers
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }

  // Determine target ping URLs
  const baseUrl = (
    options?.url ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.API_URL ||
    "https://ksoshtc-platform.onrender.com"
  ).replace(/\/+$/, "");

  const pingUrl = `${baseUrl}/api/ping`;
  const healthUrl = `${baseUrl}/health`;

  // Render idle timeout is 15 minutes. Ping every 5 minutes for guaranteed uptime.
  const intervalMinutes = options?.intervalMinutes || Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES) || 5;
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

  console.log(`[KEEP-ALIVE] Initializing 24/7 Anti-Sleep engine for: ${baseUrl} (every ${intervalMinutes} min)`);

  const executePing = (targetUrl: string, isRetry = false) => {
    try {
      const client = targetUrl.startsWith("https://") ? https : http;
      const req = client.get(targetUrl, { timeout: 15000 }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          console.log(
            `[KEEP-ALIVE] Keep-alive ping successful (${res.statusCode}) to ${targetUrl} [${new Date().toISOString()}]`
          );
        } else {
          console.warn(`[KEEP-ALIVE] Ping returned status ${res.statusCode} from ${targetUrl}`);
          if (!isRetry) scheduleRetry();
        }
        res.resume(); // free memory
      });

      req.on("error", (err) => {
        console.warn(`[KEEP-ALIVE] Ping warning to ${targetUrl}: ${err.message}`);
        if (!isRetry) scheduleRetry();
      });

      req.on("timeout", () => {
        req.destroy();
        console.warn(`[KEEP-ALIVE] Ping timed out after 15s for ${targetUrl}`);
        if (!isRetry) scheduleRetry();
      });
    } catch (err) {
      console.warn("[KEEP-ALIVE] Ping exception:", err);
      if (!isRetry) scheduleRetry();
    }
  };

  const scheduleRetry = () => {
    if (retryTimeout) return;
    console.log("[KEEP-ALIVE] Scheduling quick retry in 30s...");
    retryTimeout = setTimeout(() => {
      retryTimeout = null;
      executePing(healthUrl, true);
    }, 30 * 1000);
  };

  const pingCycle = () => {
    executePing(pingUrl);
  };

  // Run initial ping quickly after 15 seconds so server wakes and establishes connection immediately
  const initialTimeout = setTimeout(() => {
    pingCycle();
  }, 15 * 1000);

  keepAliveInterval = setInterval(pingCycle, intervalMs);
}

export function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  console.log("[KEEP-ALIVE] Anti-sleep engine stopped.");
}
