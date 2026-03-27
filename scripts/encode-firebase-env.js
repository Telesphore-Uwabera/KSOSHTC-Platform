import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function readBackendEnv() {
  const envPath = path.resolve(process.cwd(), "backend", ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function normalizeMaybeQuoted(s) {
  return String(s ?? "").trim().replace(/^["']|["']$/g, "");
}

function main() {
  readBackendEnv();

  const credPathRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credJsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (credJsonRaw && normalizeMaybeQuoted(credJsonRaw)) {
    const json = normalizeMaybeQuoted(credJsonRaw);
    const b64 = Buffer.from(json, "utf8").toString("base64");
    process.stdout.write(`FIREBASE_SERVICE_ACCOUNT_BASE64=${b64}\n`);
    return;
  }

  if (!credPathRaw) {
    console.error(
      "Missing GOOGLE_APPLICATION_CREDENTIALS (path) or FIREBASE_SERVICE_ACCOUNT (JSON) in backend/.env or environment."
    );
    process.exit(1);
  }

  const credPath = normalizeMaybeQuoted(credPathRaw);
  const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), "backend", credPath);
  if (!fs.existsSync(abs)) {
    console.error(`Service account JSON not found at: ${abs}`);
    console.error(
      "Set GOOGLE_APPLICATION_CREDENTIALS to the JSON filename in backend/.env (stored in backend/), or provide FIREBASE_SERVICE_ACCOUNT."
    );
    process.exit(1);
  }

  const json = fs.readFileSync(abs, "utf8");
  const b64 = Buffer.from(json, "utf8").toString("base64");
  process.stdout.write(`FIREBASE_SERVICE_ACCOUNT_BASE64=${b64}\n`);
}

main();

