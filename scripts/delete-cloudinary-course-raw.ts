/**
 * Delete all raw (PDF/doc) assets under ksohtc/courses/* in Cloudinary.
 * Does NOT touch ksohtc/course-covers or other folders.
 *
 * Usage:
 *   pnpm tsx scripts/delete-cloudinary-course-raw.ts --dry-run   # list counts only
 *   pnpm tsx scripts/delete-cloudinary-course-raw.ts --apply     # delete
 *
 * After deletion, Firestore lesson pdfUrl values that pointed at those URLs will break
 * until you re-upload materials and update lessons (or clear pdfUrl).
 *
 * Requires backend/.env (CLOUDINARY_*).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const PREFIXES = [
  "ksohtc/courses/construction",
  "ksohtc/courses/industrial-safety",
  "ksohtc/courses/mining",
  "ksohtc/courses/safety-management",
] as const;

const DRY = process.argv.includes("--dry-run") || !process.argv.includes("--apply");

type Listed = { public_id: string };

async function listAllRaw(prefix: string): Promise<Listed[]> {
  const out: Listed[] = [];
  let next_cursor: string | undefined;
  do {
    const r = (await cloudinary.api.resources({
      type: "upload",
      resource_type: "raw",
      prefix,
      max_results: 500,
      ...(next_cursor ? { next_cursor } : {}),
    })) as { resources?: Listed[]; next_cursor?: string };
    for (const res of r.resources ?? []) {
      if (res.public_id) out.push({ public_id: res.public_id });
    }
    next_cursor = r.next_cursor;
  } while (next_cursor);
  return out;
}

async function main(): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing CLOUDINARY_* in backend/.env");
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  let totalListed = 0;
  for (const prefix of PREFIXES) {
    const list = await listAllRaw(prefix);
    totalListed += list.length;
    console.log(`${prefix}: ${list.length} raw asset(s)`);
    if (!DRY && list.length > 0) {
      const res = await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: "raw",
        type: "upload",
        invalidate: true,
      } as Record<string, unknown>);
      console.log(`  deleted:`, JSON.stringify(res));
    }
  }

  if (DRY) {
    console.log(`\nDRY-RUN: ${totalListed} total raw file(s) would be deleted. Run with --apply to delete.`);
  } else {
    console.log(`\nDone. Removed raw assets under ksohtc/courses/*. Update Firestore lesson pdfUrls after re-uploading.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
