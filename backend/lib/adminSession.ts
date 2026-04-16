import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@shared/api";

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function getAdminSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || null;
}

export type StaffRole = Extract<UserRole, "admin" | "instructor">;

type StaffSessionPayloadV2 = {
  v: 2;
  exp: number;
  role: StaffRole;
  userId: string;
};

/** Signed token for staff API access (admin + instructor). */
export function issueAdminSessionToken(input: { role: StaffRole; userId: string }): string | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;
  const payload: StaffSessionPayloadV2 = { v: 2, exp: Date.now() + TOKEN_MAX_AGE_MS, ...input };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionToken(
  token: string | null | undefined
): { ok: true; payload: StaffSessionPayloadV2 } | { ok: false } {
  if (!token || typeof token !== "string") return { ok: false };
  const secret = getAdminSessionSecret();
  if (!secret) return { ok: false };
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return { ok: false };
  const payloadB64 = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return { ok: false };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false };
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Partial<StaffSessionPayloadV2>;
    if (payload.v !== 2) return { ok: false };
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return { ok: false };
    if (payload.role !== "admin" && payload.role !== "instructor") return { ok: false };
    if (typeof payload.userId !== "string" || !payload.userId.trim()) return { ok: false };
    return { ok: true, payload: payload as StaffSessionPayloadV2 };
  } catch {
    return { ok: false };
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
  const v = verifyAdminSessionToken(getBearerToken(req));
  return v.ok && v.payload.role === "admin";
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
  const v = verifyAdminSessionToken(getBearerToken(req));
  if (!v.ok || v.payload.role !== "admin") {
    res.status(401).json({
      error: "Admin session expired or missing. Sign out and sign in again from the admin login page.",
    });
    return;
  }
  next();
}

export type StaffSessionResult =
  | { ok: true; payload: StaffSessionPayloadV2 }
  | { ok: false; error: "missing_secret" | "unauthorized" };

export function getStaffSession(req: Request): StaffSessionResult {
  const secret = getAdminSessionSecret();
  if (!secret) return { ok: false, error: "missing_secret" };
  const v = verifyAdminSessionToken(getBearerToken(req));
  if (!v.ok) return { ok: false, error: "unauthorized" };
  return v;
}

export function requireStaffSession(allowedRoles: StaffRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const secret = getAdminSessionSecret();
    if (!secret) {
      if (!warnedMissingSecret) {
        warnedMissingSecret = true;
        console.warn(
          "[AUTH] ADMIN_SESSION_SECRET is not set. Admin/staff API routes are not protected. Set ADMIN_SESSION_SECRET for production."
        );
      }
      next();
      return;
    }

    const v = verifyAdminSessionToken(getBearerToken(req));
    if (!v.ok || !allowedRoles.includes(v.payload.role)) {
      res.status(401).json({
        error: "Session expired or missing. Sign out and sign in again.",
      });
      return;
    }
    (req as any).staffSession = v.payload;
    next();
  };
}
