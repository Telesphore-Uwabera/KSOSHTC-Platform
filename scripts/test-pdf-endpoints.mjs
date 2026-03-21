/**
 * Manual smoke test: PDF resolution + static /courses PDF (requires backend running).
 *
 * Usage:
 *   pnpm run dev:backend   # in another terminal
 *   node scripts/test-pdf-endpoints.mjs
 *
 * Optional: BACKEND_URL=http://localhost:8085
 */
const base = (process.env.BACKEND_URL || "http://localhost:8085").replace(/\/$/, "");

async function main() {
  const results = [];

  // 1) Ping
  try {
    const r = await fetch(`${base}/api/ping`, { signal: AbortSignal.timeout(15000) });
    results.push(["GET /api/ping", r.ok ? "OK" : `FAIL ${r.status}`]);
  } catch (e) {
    results.push(["GET /api/ping", `FAIL ${e.message}`]);
    console.log("Backend not reachable. Start with: pnpm run dev:backend\n");
    for (const [name, status] of results) console.log(`${name}: ${status}`);
    process.exit(1);
  }

  // 2) resolve-pdf (title shape similar to CourseDetail modal)
  const title = encodeURIComponent("Section 2 – 2 Hazard Asssement");
  let resolveBody = null;
  try {
    const r = await fetch(
      `${base}/api/course-content/courses/mining/resolve-pdf?title=${title}`,
      { signal: AbortSignal.timeout(60000) }
    );
    resolveBody = await r.json().catch(() => ({}));
    results.push([
      "GET resolve-pdf (mining)",
      r.ok ? `OK → pdfUrl: ${JSON.stringify(resolveBody.pdfUrl)}` : `FAIL ${r.status}`,
    ]);
  } catch (e) {
    results.push(["GET resolve-pdf (mining)", `FAIL ${e.message}`]);
  }

  // 3) Stored relative path (what iframe loads in dev)
  const rel = "/courses/mining/2%2B-%2BHazard%2BAsssement.pdf";
  try {
    const r = await fetch(`${base}${rel}`, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(120000),
    });
    const code = r.status;
    const okPdf = code === 200 && (r.headers.get("content-type") || "").includes("pdf");
    const redirected = code >= 300 && code < 400;
    results.push([
      `GET ${rel}`,
      okPdf
        ? "OK (PDF bytes)"
        : redirected
          ? `REDIRECT ${code} → ${r.headers.get("location") || "?"}`
          : `HTTP ${code} (expected 404 if file missing on disk / not Cloudinary)`,
    ]);
  } catch (e) {
    results.push([`GET ${rel}`, `FAIL ${e.message}`]);
  }

  console.log("\n--- PDF endpoint smoke test ---\n");
  for (const [name, status] of results) console.log(`${name}\n  ${status}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
