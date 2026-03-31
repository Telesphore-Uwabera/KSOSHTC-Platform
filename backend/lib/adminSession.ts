import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function getAdminSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || null;
}

/** Signed token for admin API access (returned only on successful env-based admin login). */
export function issueAdminSessionToken(): string | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;
  const payload = { v: 1 as const, exp: Date.now() + TOKEN_MAX_AGE_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const secret = getAdminSessionSecret();
  if (!secret) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payloadB64 = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function isAdminSessionAuthorized(req: Request): boolean {
  const secret = getAdminSessionSecret();
  if (!secret) return true;
  return verifyAdminSessionToken(getBearerToken(req));
}

let warnedMissingSecret = false;

/**
 * Require a valid admin session token when ADMIN_SESSION_SECRET is set.
 * If unset, logs a warning once and allows requests (legacy deploys); set ADMIN_SESSION_SECRET in production.
 */
export function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  const secret = getAdminSessionSecret();
  if (!secret) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn(
        "[AUTH] ADMIN_SESSION_SECRET is not set. Admin API routes are not protected. Set ADMIN_SESSION_SECRET for production."
      );
    }
    next();
    return;
  }
  if (!verifyAdminSessionToken(getBearerToken(req))) {
    res.status(401).json({
      error: "Admin session expired or missing. Sign out and sign in again from the admin login page.",
    });
    return;
  }
  next();
}
