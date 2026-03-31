import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const ip =
    typeof fwd === "string"
      ? fwd.split(",")[0]?.trim()
      : Array.isArray(fwd)
        ? fwd[0]
        : req.socket?.remoteAddress ?? "unknown";
  return ip || "unknown";
}

/** Simple fixed-window limiter (per IP). */
export function createRateLimiter(maxPerWindow: number, windowMs: number) {
  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const key = clientKey(req);
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > maxPerWindow) {
      res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
      return;
    }
    next();
  };
}

export const rateLimitLogin = createRateLimiter(30, 60_000);
export const rateLimitRegister = createRateLimiter(10, 60_000);
