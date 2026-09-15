import https from "node:https";
import http from "node:http";

let keepAliveInterval: NodeJS.Timeout | null = null;

/**
 * Pings the external public URL of the backend at regular intervals
 * to prevent Render's free tier from spinning down after 15 minutes of inactivity.
 */
export function startKeepAlive(options?: {
  url?: string;
  intervalMinutes?: number;
}): void {
  // Only run in production or when explicitly enabled
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const forceEnable = process.env.KEEP_ALIVE === "true";

  if (!isProduction && !forceEnable) {
    console.log("[KEEP-ALIVE] Development environment detected; skipping self-ping.");
    return;
  }

  // Prevent multiple timers
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  // Determine target ping URL
  const rawTargetUrl =
    options?.url ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.API_URL ||
    "https://ksoshtc-platform.onrender.com";

  // Normalize target URL to ping the /api/ping endpoint
  const targetUrl = rawTargetUrl.endsWith("/api/ping")
    ? rawTargetUrl
    : `${rawTargetUrl.replace(/\/+$/, "")}/api/ping`;

  // Ping interval: 12 minutes (Render idle timeout is 15 minutes)
  const intervalMinutes = options?.intervalMinutes || Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES) || 12;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[KEEP-ALIVE] Initializing Render anti-sleep pinger for: ${targetUrl} (every ${intervalMinutes} min)`);

  const ping = () => {
    try {
      const client = targetUrl.startsWith("https://") ? https : http;
      const req = client.get(targetUrl, { timeout: 10000 }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`[KEEP-ALIVE] Ping successful (${res.statusCode}) to ${targetUrl} at ${new Date().toISOString()}`);
        } else {
          console.warn(`[KEEP-ALIVE] Ping returned status ${res.statusCode} from ${targetUrl}`);
        }
        res.resume(); // consume response data to free memory
      });

      req.on("error", (err) => {
        console.warn(`[KEEP-ALIVE] Ping warning: ${err.message}`);
      });

      req.on("timeout", () => {
        req.destroy();
        console.warn("[KEEP-ALIVE] Ping timed out after 10s");
      });
    } catch (err) {
      console.warn("[KEEP-ALIVE] Ping error:", err);
    }
  };

  // Run initial ping after 2 minutes so the server has fully finished booting
  const initialTimeout = setTimeout(ping, 2 * 60 * 1000);
  if (typeof initialTimeout.unref === "function") {
    initialTimeout.unref();
  }

  keepAliveInterval = setInterval(ping, intervalMs);
  if (typeof keepAliveInterval.unref === "function") {
    keepAliveInterval.unref();
  }
}

export function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log("[KEEP-ALIVE] Anti-sleep pinger stopped.");
  }
}
