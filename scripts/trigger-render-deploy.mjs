/**
 * Trigger a Render deploy via HTTPS API (no interactive CLI).
 *
 * Env:
 *   RENDER_API_KEY      — Dashboard → Account → API Keys (starts with rnd_)
 *   RENDER_SERVICE_ID   — Web service → Settings → Service ID (srv-...)
 *
 * Usage: RENDER_API_KEY=... RENDER_SERVICE_ID=... node scripts/trigger-render-deploy.mjs
 *    or: pnpm deploy:render:api
 */
const key = process.env.RENDER_API_KEY?.trim();
const serviceId = process.env.RENDER_SERVICE_ID?.trim();

if (!key || !serviceId) {
  console.error("Set RENDER_API_KEY and RENDER_SERVICE_ID.");
  process.exit(1);
}

const url = `https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/deploys`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: "{}",
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

if (!res.ok) {
  console.error("Render API error:", res.status, body);
  process.exit(1);
}

console.log("Deploy triggered:", JSON.stringify(body, null, 2));
