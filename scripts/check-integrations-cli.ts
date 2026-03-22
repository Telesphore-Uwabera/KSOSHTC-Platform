/**
 * CLI smoke check: local backend/.env (masked) + Cloudinary Admin API + Firestore read.
 * Does NOT print secrets. Render cloud env must be checked in dashboard or Render API.
 *
 *   pnpm exec tsx scripts/check-integrations-cli.ts
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { getDb } from "../backend/lib/firestore";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

function mask(s?: string): string {
  if (!s) return "(missing)";
  if (s.length <= 8) return "****";
  return `${s.slice(0, 3)}...${s.slice(-4)}`;
}

async function main(): Promise<void> {
  const cn = process.env.CLOUDINARY_CLOUD_NAME;
  const ak = process.env.CLOUDINARY_API_KEY;
  const as = process.env.CLOUDINARY_API_SECRET;

  console.log("=== Local file: backend/.env (values masked) ===");
  console.log("CLOUDINARY_CLOUD_NAME:", cn || "(missing)");
  console.log("CLOUDINARY_API_KEY:", mask(ak));
  console.log("CLOUDINARY_API_SECRET:", mask(as));
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("Firebase: FIREBASE_SERVICE_ACCOUNT_BASE64 (set, not shown)");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Firebase: FIREBASE_SERVICE_ACCOUNT (set, not shown)");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("Firebase: GOOGLE_APPLICATION_CREDENTIALS=", process.env.GOOGLE_APPLICATION_CREDENTIALS);
  } else {
    console.log("Firebase: (no standard env found in .env)");
  }

  console.log("\n=== Cloudinary Admin API (uses .env credentials) ===");
  if (!cn || !ak || !as) {
    console.log("Skipped — incomplete Cloudinary env");
  } else {
    cloudinary.config({ cloud_name: cn, api_key: ak, api_secret: as });
    try {
      await cloudinary.api.resources({
        resource_type: "raw",
        type: "upload",
        prefix: "ksohtc/courses",
        max_results: 1,
      });
      console.log("OK — can list raw assets under ksohtc/courses/");
    } catch (e) {
      console.log("FAIL:", e instanceof Error ? e.message : e);
    }
  }

  console.log("\n=== Firestore (uses .env / GOOGLE_APPLICATION_CREDENTIALS) ===");
  try {
    const db = getDb();
    await db.collection("courses").limit(1).get();
    console.log("OK — Firestore read (courses) works");
  } catch (e) {
    console.log("FAIL:", e instanceof Error ? e.message : e);
  }

  console.log("\n=== Render (production host — cannot list dashboard env from this script) ===");
  const renderUrl = process.env.RENDER_HEALTH_URL || "https://ksohtc-platform.onrender.com";
  try {
    const r = await fetch(`${renderUrl.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    console.log(`GET ${renderUrl}/health → HTTP ${r.status}`, JSON.stringify(j));
  } catch (e) {
    console.log("FAIL:", e instanceof Error ? e.message : e);
  }
  console.log(
    "To see env vars ON Render: Dashboard → your Web Service → Environment, or install Render CLI + `render config init` then `render services` / API."
  );

  console.log("\n=== Firebase CLI (account projects) ===");
  console.log("Run: firebase projects:list   (current project used by CLI may differ from backend .env)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
