/**
 * Re-upload course materials from local export to Cloudinary (ksohtc/courses/<courseId>/)
 * and update Firestore lesson pdfUrl to the new secure_url.
 *
 * Uses backend/.env:
 *   - CLOUDINARY_* for uploads
 *   - GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_SERVICE_ACCOUNT* for Firestore (same as backend)
 *
 * Source folder (default): downloads/cloudinary-export/<courseId>/ (PDF files only)
 *
 * Usage:
 *   pnpm tsx scripts/reupload-courses-from-export.ts              # dry-run
 *   pnpm tsx scripts/reupload-courses-from-export.ts --apply      # upload + Firestore
 *   pnpm tsx scripts/reupload-courses-from-export.ts --apply --strict
 *   pnpm tsx scripts/reupload-courses-from-export.ts --apply --course=construction
 */
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { getDb } from "../backend/lib/firestore";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const ALL_COURSES = ["construction", "industrial-safety", "mining", "safety-management"] as const;

const APPLY = process.argv.includes("--apply");
const STRICT = process.argv.includes("--strict");
const courseArg = process.argv.find((a) => a.startsWith("--course="));
const COURSE_FILTER = courseArg ? courseArg.split("=")[1]?.trim() : null;

const EXPORT_ROOT = path.resolve(process.cwd(), "downloads", "cloudinary-export");

/** Course Cloudinary folder is PDF-only. */
const ALLOWED_EXT = [".pdf"];

function norm(s: string): string {
  try {
    return decodeURIComponent(s)
      .trim()
      .toLowerCase()
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9]/g, "");
  } catch {
    return s
      .trim()
      .toLowerCase()
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9]/g, "");
  }
}

function coreNorm(s: string): string {
  const n = norm(s);
  return n.replace(/^\d+/, "");
}

function tailPublicId(publicId: string): string {
  const i = publicId.lastIndexOf("/");
  return i >= 0 ? publicId.slice(i + 1) : publicId;
}

type CloudAsset = { public_id: string; secure_url: string };

function leadingNumKey(n: string): string | null {
  const m = n.match(/^(\d+)/);
  return m ? m[1] : null;
}

function numsAllowFuzzy(a: string, b: string): boolean {
  const la = leadingNumKey(a);
  const lb = leadingNumKey(b);
  if (!la || !lb) return true;
  return la === lb;
}

function scoreMatch(lessonTitle: string, pdfUrl: string, asset: CloudAsset): number {
  const filename = (pdfUrl.split("/").pop() || "").split("?")[0] || "";
  const tail = tailPublicId(asset.public_id);
  const nt = norm(lessonTitle);
  const nf = norm(filename);
  const ntail = norm(tail);
  const ct = coreNorm(lessonTitle);
  const cf = coreNorm(filename);
  const ctail = coreNorm(tail);
  const MIN_CORE = 10;

  if (nf && ntail && nf === ntail) return 1000;
  if (nt && ntail && nt === ntail) return 950;

  if (!STRICT) {
    if (cf && ctail && cf === ctail && cf.length >= MIN_CORE) return 920;
    if (ct && ctail && ct === ctail && ct.length >= MIN_CORE) return 900;
  }

  if (nf.length >= 12 && ntail.includes(nf) && numsAllowFuzzy(nf, ntail)) return 700;
  if (ntail.length >= 12 && nf.includes(ntail) && numsAllowFuzzy(nf, ntail)) return 650;
  if (nt.length >= 14 && ntail.includes(nt) && numsAllowFuzzy(nt, ntail)) return 600;
  if (nt.length >= 14 && nt.includes(ntail) && numsAllowFuzzy(nt, ntail)) return 550;

  if (!STRICT) {
    if (ct.length >= MIN_CORE && ctail.includes(ct)) return 500;
    if (ctail.length >= MIN_CORE && ct.includes(ctail)) return 480;
  }
  return 0;
}

function bestMatch(assets: CloudAsset[], lessonTitle: string, pdfUrl: string): CloudAsset | null {
  let best: { asset: CloudAsset; score: number } | null = null;
  for (const asset of assets) {
    const s = scoreMatch(lessonTitle, pdfUrl, asset);
    if (s > 0 && (!best || s > best.score)) best = { asset, score: s };
  }
  if (!best || best.score < (STRICT ? 550 : 480)) return null;
  return best.asset;
}

/** Prefer same-course file; else another course if score is high (mining lessons often used industrial PDFs). */
function resolveLessonAsset(
  byCourse: Map<string, CloudAsset[]>,
  courseId: string,
  lessonTitle: string,
  pdfUrl: string
): CloudAsset | null {
  const local = byCourse.get(courseId) ?? [];
  const localM = bestMatch(local, lessonTitle, pdfUrl);
  if (localM) return localM;

  const minCross = STRICT ? 950 : 900;
  let best: { asset: CloudAsset; score: number } | null = null;
  for (const [cid, assets] of byCourse) {
    if (cid === courseId) continue;
    for (const asset of assets) {
      const s = scoreMatch(lessonTitle, pdfUrl, asset);
      if (s >= minCross && (!best || s > best.score)) best = { asset, score: s };
    }
  }
  return best?.asset ?? null;
}

async function uploadFile(courseId: string, filePath: string): Promise<CloudAsset> {
  const base = path.basename(filePath);
  const safeName = path.basename(base).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
  const ext = path.extname(safeName).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error(`Unsupported type: ${ext}`);
  }
  const buf = await fs.promises.readFile(filePath);
  if (buf.length > 50 * 1024 * 1024) {
    throw new Error("File too large (max 50MB)");
  }
  const contentBase64 = buf.toString("base64");
  const uri = `data:application/octet-stream;base64,${contentBase64}`;
  const result = await cloudinary.uploader.upload(uri, {
    folder: `ksohtc/courses/${courseId}`,
    public_id: path.parse(safeName).name,
    resource_type: "raw",
  });
  if (!result.public_id || !result.secure_url) {
    throw new Error("Cloudinary upload missing public_id or secure_url");
  }
  return { public_id: result.public_id, secure_url: result.secure_url };
}

async function listExportFiles(courseDir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(courseDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(courseDir, e.name))
    .filter((p) => ALLOWED_EXT.includes(path.extname(p).toLowerCase()));
}

async function main(): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing CLOUDINARY_* in backend/.env");
    process.exit(1);
  }

  const courses = COURSE_FILTER
    ? ALL_COURSES.filter((c) => c === COURSE_FILTER)
    : [...ALL_COURSES];

  if (COURSE_FILTER && courses.length === 0) {
    console.error(`Invalid --course=${COURSE_FILTER}. Use: ${ALL_COURSES.join(", ")}`);
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const db = getDb();
  let uploadOk = 0;
  let uploadFail = 0;
  let lessonUpdated = 0;
  let lessonSkipped = 0;
  let lessonNoMatch = 0;
  let batch = APPLY ? db.batch() : null;
  let batchCount = 0;

  async function flushBatch(): Promise<void> {
    if (!APPLY || !batch || batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }

  const byCourse = new Map<string, CloudAsset[]>();

  // Phase 1: upload (or dry-run list) → assets per course
  for (const courseId of courses) {
    const courseDir = path.join(EXPORT_ROOT, courseId);
    if (!fs.existsSync(courseDir)) {
      console.warn(`Skip ${courseId}: folder missing (${courseDir})`);
      byCourse.set(courseId, []);
      continue;
    }

    const files = await listExportFiles(courseDir);
    files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
    console.log(`\n=== ${courseId}: ${files.length} file(s) in export ===`);

    const assets: CloudAsset[] = [];

    for (const filePath of files) {
      const name = path.basename(filePath);
      if (!APPLY) {
        console.log(`  [dry-run] would upload: ${name}`);
        const stem = path.parse(path.basename(name).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_")).name;
        assets.push({
          public_id: `ksohtc/courses/${courseId}/${stem}`,
          secure_url: `(dry-run)`,
        });
        uploadOk++;
        continue;
      }

      try {
        process.stdout.write(`  upload: ${name} ... `);
        const asset = await uploadFile(courseId, filePath);
        console.log("OK");
        assets.push(asset);
        uploadOk++;
      } catch (e) {
        console.log(`FAIL ${e instanceof Error ? e.message : e}`);
        uploadFail++;
      }
    }

    byCourse.set(courseId, assets);
  }

  // Phase 2: match Firestore lessons (same-course first, then cross-course if score ≥ 900)
  for (const courseId of courses) {
    console.log(`\n=== ${courseId}: update lesson pdfUrls ===`);
    const modulesSnap = await db.collection("courses").doc(courseId).collection("modules").get();
    for (const modDoc of modulesSnap.docs) {
      const lessonsSnap = await modDoc.ref.collection("lessons").get();
      for (const lessonDoc of lessonsSnap.docs) {
        const data = lessonDoc.data();
        const pdfUrl = (data.pdfUrl ?? "").toString().trim();
        const title = (data.title ?? "").toString();
        if (!pdfUrl) {
          lessonSkipped++;
          continue;
        }
        const match = resolveLessonAsset(byCourse, courseId, title, pdfUrl);
        if (!match) {
          lessonNoMatch++;
          if (APPLY) {
            console.log(`  [no match] lesson "${title}" pdfUrl=${pdfUrl.slice(0, 80)}...`);
          }
          continue;
        }
        if (APPLY && match.secure_url === pdfUrl) {
          lessonSkipped++;
          continue;
        }
        if (!APPLY) {
          lessonUpdated++;
          continue;
        }
        batch!.update(lessonDoc.ref, { pdfUrl: match.secure_url });
        batchCount++;
        lessonUpdated++;
        if (batchCount >= 400) await flushBatch();
      }
    }
    await flushBatch();
  }

  await flushBatch();

  console.log("\n--- summary ---");
  console.log(`Uploads: ${uploadOk} ok, ${uploadFail} failed (${APPLY ? "live" : "dry-run placeholders"})`);
  console.log(`Lessons: ${lessonUpdated} ${APPLY ? "updated" : "would update"}, skipped (no pdfUrl or unchanged): ${lessonSkipped}, no match: ${lessonNoMatch}`);
  console.log(
    APPLY
      ? "Done. Uses CLOUDINARY_* + Firebase credentials from backend/.env (same as production backend)."
      : "Dry-run. Pass --apply to upload and update Firestore."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
