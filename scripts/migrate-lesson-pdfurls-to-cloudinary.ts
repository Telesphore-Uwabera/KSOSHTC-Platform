/**
 * Migrate Firestore lesson pdfUrl from legacy /courses/... paths to Cloudinary secure_url.
 *
 * Loads all raw uploads under ksohtc/courses/<courseId> and matches each lesson by
 * normalized filename and title (leading numbers stripped so "2 Hazard X" matches "15. Hazard X").
 *
 * Usage:
 *   pnpm tsx scripts/migrate-lesson-pdfurls-to-cloudinary.ts              # dry-run
 *   pnpm tsx scripts/migrate-lesson-pdfurls-to-cloudinary.ts --apply        # write MongoDB
 *   pnpm tsx scripts/migrate-lesson-pdfurls-to-cloudinary.ts --strict       # only exact / tight fuzzy (fewer updates)
 *
 * Heuristic matching can map a lesson to a Cloudinary file whose index differs from the
 * legacy filename (e.g. "4.2 Cranes" → "15. Cranes"). Spot-check critical lessons after --apply.
 *
 * Requires backend/.env (CLOUDINARY_* + MONGODB_URI).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { scriptMongoConnect } from "./lib/mongo-script";
import { MONGO_COLLECTIONS } from "../backend/lib/mongo";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const COURSE_IDS = ["construction", "industrial-safety", "mining", "safety-management"] as const;

const APPLY = process.argv.includes("--apply");
/** Safer matching (skips coreNorm / cross-folder heuristics). */
const STRICT = process.argv.includes("--strict");

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

/** Drop leading digits so "2hazard…" can align with "15hazard…" (lenient mode only). */
function coreNorm(s: string): string {
  const n = norm(s);
  return n.replace(/^\d+/, "");
}

function tailPublicId(publicId: string): string {
  const i = publicId.lastIndexOf("/");
  return i >= 0 ? publicId.slice(i + 1) : publicId;
}

type CloudAsset = { public_id: string; secure_url: string };

async function fetchAllRawForCourse(courseId: string): Promise<CloudAsset[]> {
  const prefix = `ksohtc/courses/${courseId}`;
  const out: CloudAsset[] = [];
  let next_cursor: string | undefined;
  do {
    const r = (await cloudinary.api.resources({
      type: "upload",
      resource_type: "raw",
      prefix,
      max_results: 500,
      ...(next_cursor ? { next_cursor } : {}),
    })) as { resources?: CloudAsset[]; next_cursor?: string };
    for (const res of r.resources ?? []) {
      if (res.public_id && res.secure_url) out.push({ public_id: res.public_id, secure_url: res.secure_url });
    }
    next_cursor = r.next_cursor;
  } while (next_cursor);
  return out;
}

/** Leading numeric token in normalized string (e.g. lesson / file index). */
function leadingNumKey(n: string): string | null {
  const m = n.match(/^(\d+)/);
  return m ? m[1] : null;
}

/** For fuzzy matches, avoid pairing different numbered materials (e.g. "14 …" with "9 …"). */
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

/** If same course has no match, try other course folders (uploads sometimes land in wrong folder). */
function bestMatchCrossCourse(
  byCourse: Map<string, CloudAsset[]>,
  courseId: string,
  lessonTitle: string,
  pdfUrl: string
): { asset: CloudAsset; fromCourse: string } | null {
  let best: { asset: CloudAsset; fromCourse: string; score: number } | null = null;
  for (const [cid, assets] of byCourse) {
    for (const asset of assets) {
      const s = scoreMatch(lessonTitle, pdfUrl, asset);
      if (s > 0 && (!best || s > best.score)) best = { asset, fromCourse: cid, score: s };
    }
  }
  if (!best || best.score < (STRICT ? 950 : 900)) return null;
  if (best.fromCourse === courseId) return { asset: best.asset, fromCourse: best.fromCourse };
  if (best.score >= (STRICT ? 950 : 900)) return { asset: best.asset, fromCourse: best.fromCourse };
  return null;
}

async function main(): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in backend/.env");
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const byCourse = new Map<string, CloudAsset[]>();

  for (const courseId of COURSE_IDS) {
    const assets = await fetchAllRawForCourse(courseId);
    byCourse.set(courseId, assets);
    console.log(`Cloudinary ${courseId}: ${assets.length} raw file(s)`);
  }

  let examined = 0;
  let alreadyHttp = 0;
  let empty = 0;
  let wouldUpdate = 0;
  let unmatched = 0;

  const { client, db } = await scriptMongoConnect();
  try {
    const lessonsCol = db.collection(MONGO_COLLECTIONS.lessons);
    const lessonRows = await lessonsCol.find({ courseId: { $in: [...COURSE_IDS] } }).toArray();

    for (const row of lessonRows) {
      const lessonId = row.id as string;
      const courseId = row.courseId as string;
      const data = row as { pdfUrl?: string; title?: string };
      const pdfUrl = (data.pdfUrl ?? "").toString().trim();
      const title = (data.title ?? "").toString();

      if (!pdfUrl) {
        empty++;
        continue;
      }
      examined++;
      if (pdfUrl.startsWith("http")) {
        alreadyHttp++;
        continue;
      }

      const localAssets = byCourse.get(courseId) ?? [];
      let match = bestMatch(localAssets, title, pdfUrl);
      let matchedFrom = courseId;
      if (!match) {
        const cross = bestMatchCrossCourse(byCourse, courseId, title, pdfUrl);
        if (cross) {
          match = cross.asset;
          matchedFrom = cross.fromCourse;
        }
      }

      if (!match) {
        unmatched++;
        console.log(`[NO MATCH] course=${courseId} lesson=${lessonId} title="${title}" pdfUrl=${pdfUrl}`);
        continue;
      }

      wouldUpdate++;
      const note = matchedFrom !== courseId ? ` (from ${matchedFrom})` : "";
      console.log(
        `[UPDATE] course=${courseId} lesson=${lessonId} "${title}"\n  ${pdfUrl}\n  -> ${match.secure_url}${note}`
      );

      if (APPLY) {
        await lessonsCol.updateOne({ id: lessonId }, { $set: { pdfUrl: match.secure_url } });
      }
    }
  } finally {
    await client.close();
  }

  console.log("\n--- summary ---");
  console.log(`lessons with pdfUrl examined (non-http): ${examined - alreadyHttp - empty}`);
  console.log(`already https: ${alreadyHttp}`);
  console.log(`empty pdfUrl: ${empty}`);
  console.log(`would update / updated: ${wouldUpdate}`);
  console.log(`unmatched: ${unmatched}`);
  console.log(
    APPLY ? "Mode: APPLY (writes committed)" : "Mode: DRY-RUN (no writes). Pass --apply to update MongoDB."
  );
  console.log(STRICT ? "Matching: STRICT" : "Matching: lenient (use --strict for fewer, safer matches).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
