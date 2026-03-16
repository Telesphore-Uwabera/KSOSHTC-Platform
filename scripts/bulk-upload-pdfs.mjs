/**
 * bulk-upload-pdfs.mjs
 * 
 * Reads every PDF under public/courses/<courseId>/*.pdf, sends them to the
 * running local backend (POST /api/course-content/courses/:courseId/upload-pdf),
 * and creates matching Firestore lesson records via the backend API.
 *
 * Usage (from repo root, while `npm run dev` is running):
 *   node scripts/bulk-upload-pdfs.mjs [--dry-run] [--force]
 *
 * All PDFs in a folder are placed under ONE module called "Course Materials".
 * Existing lessons with the same title are skipped unless --force is used.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../backend/.env") });

// ── Config ─────────────────────────────────────────────────────────────────
const DRY_RUN  = process.argv.includes("--dry-run");
const FORCE    = process.argv.includes("--force");
const BASE_URL = "http://localhost:8080";   // change port if needed
const PUBLIC   = path.resolve(__dirname, "../public/courses");
const MODULE_TITLE = "Course Materials";
const NOW      = new Date().toISOString();

// ── Helpers ─────────────────────────────────────────────────────────────────
async function apiGet(url) {
  const res = await fetch(`${BASE_URL}${url}`);
  if (!res.ok) return null;
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${url} failed: ${data.error ?? res.statusText}`);
  return data;
}

async function ensureCourse(courseId, title) {
  const existing = await apiGet(`/api/course-content/courses/${courseId}`);
  if (existing && existing.id) return;
  console.log(`  [API] Creating course: ${courseId}`);
  if (!DRY_RUN) {
    await apiPost("/api/course-content/courses", {
      slug: courseId,
      title,
      sector: courseId,
      description: "",
      duration: "3 months",
    }).catch((e) => console.warn(`    course create warning: ${e.message}`));
  }
}

async function ensureModule(courseId) {
  const data = await apiGet(`/api/course-content/courses/${courseId}/modules`);
  const modules = data?.modules ?? [];
  const existing = modules.find((m) => m.title === MODULE_TITLE);
  if (existing) return existing.id;

  console.log(`  [API] Creating module "${MODULE_TITLE}" for ${courseId}`);
  if (DRY_RUN) return "dry-run-module-id";
  const result = await apiPost(`/api/course-content/courses/${courseId}/modules`, {
    title: MODULE_TITLE,
    order: modules.length,
  });
  return result.id;
}

async function getLessons(courseId, moduleId) {
  const data = await apiGet(`/api/course-content/courses/${courseId}/modules/${moduleId}/lessons`);
  return data?.lessons ?? [];
}

async function uploadPdf(courseId, filename, buf) {
  const base64 = buf.toString("base64");
  return apiPost(`/api/course-content/courses/${courseId}/upload-pdf`, {
    filename,
    contentBase64: base64,
  });
}

async function createLesson(courseId, moduleId, title, pdfUrl, order) {
  return apiPost(`/api/course-content/courses/${courseId}/modules/${moduleId}/lessons`, {
    title,
    order,
    pdfUrl,
    published: true,
    contentHtml: "",
  });
}

const COURSE_NAMES = {
  construction: "Construction Safety",
  "industrial-safety": "Industrial Safety",
  mining: "Mining Safety",
  "safety-management": "Safety Management (General)",
  "safety-for-all": "Safety for All",
};

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log("\n🔍 DRY RUN MODE – nothing will be written.\n");

  // Check backend is running
  const ping = await fetch(`${BASE_URL}/health`).catch(() => null);
  if (!ping) {
    console.error(`❌ Cannot reach backend at ${BASE_URL}. Make sure 'npm run dev' is running.`);
    process.exit(1);
  }

  const courseFolders = fs.readdirSync(PUBLIC).filter((f) =>
    fs.statSync(path.join(PUBLIC, f)).isDirectory()
  );

  let totalUploaded = 0;
  let totalSkipped  = 0;

  for (const courseId of courseFolders) {
    const courseDir = path.join(PUBLIC, courseId);
    const pdfs = fs.readdirSync(courseDir)
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .sort();

    if (pdfs.length === 0) continue;
    console.log(`\n📚 ${courseId} (${pdfs.length} PDFs)`);

    await ensureCourse(courseId, COURSE_NAMES[courseId] ?? courseId);
    const moduleId = await ensureModule(courseId);
    const existingLessons = await getLessons(courseId, moduleId);
    const existingTitles = new Set(existingLessons.map((l) => l.title));

    for (let i = 0; i < pdfs.length; i++) {
      const filename = pdfs[i];
      const title = path.basename(filename, ".pdf");

      if (existingTitles.has(title) && !FORCE) {
        console.log(`  ⏭  Skipping (already exists): ${filename}`);
        totalSkipped++;
        continue;
      }

      console.log(`  ⬆  Uploading (${i + 1}/${pdfs.length}): ${filename}`);
      if (DRY_RUN) { totalUploaded++; continue; }

      try {
        const buf = fs.readFileSync(path.join(courseDir, filename));
        const uploadResult = await uploadPdf(courseId, filename, buf);
        const pdfUrl = uploadResult.pdfUrl;
        console.log(`     → ${pdfUrl}`);
        await createLesson(courseId, moduleId, title, pdfUrl, i);
        totalUploaded++;
      } catch (err) {
        console.error(`  ❌ Failed: ${filename} – ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Done! Uploaded: ${totalUploaded}, Skipped: ${totalSkipped}`);
  process.exit(0);
}

main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
