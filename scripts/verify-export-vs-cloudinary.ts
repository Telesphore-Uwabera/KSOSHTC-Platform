/**
 * Compare downloads/cloudinary-export/<course>/ files to Cloudinary raw assets
 * under ksohtc/courses/<course>/ (same public_id rules as reupload-courses-from-export).
 *
 * Usage: pnpm tsx scripts/verify-export-vs-cloudinary.ts
 *
 * Requires backend/.env CLOUDINARY_*.
 */
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const ALL_COURSES = ["construction", "industrial-safety", "mining", "safety-management"] as const;
const EXPORT_ROOT = path.resolve(process.cwd(), "downloads", "cloudinary-export");
const ALLOWED_EXT = [".pdf"];

function expectedPublicId(courseId: string, fileBasename: string): string {
  const safeName = path.basename(fileBasename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
  const stem = path.parse(safeName).name;
  return `ksohtc/courses/${courseId}/${stem}`;
}

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

  let totalLocal = 0;
  let totalMissingOnCloud = 0;
  let totalExtraOnCloud = 0;

  for (const courseId of ALL_COURSES) {
    const courseDir = path.join(EXPORT_ROOT, courseId);
    const prefix = `ksohtc/courses/${courseId}`;

    const localIds = new Set<string>();
    if (fs.existsSync(courseDir)) {
      const names = await fs.promises.readdir(courseDir);
      for (const name of names) {
        const p = path.join(courseDir, name);
        const st = await fs.promises.stat(p);
        if (!st.isFile()) continue;
        if (!ALLOWED_EXT.includes(path.extname(name).toLowerCase())) continue;
        localIds.add(expectedPublicId(courseId, name));
      }
    }

    const cloudList = await listAllRaw(prefix);
    const cloudIds = new Set(cloudList.map((r) => r.public_id));

    const missingOnCloud = [...localIds].filter((id) => !cloudIds.has(id));
    const extraOnCloud = [...cloudIds].filter((id) => !localIds.has(id));

    totalLocal += localIds.size;
    totalMissingOnCloud += missingOnCloud.length;
    totalExtraOnCloud += extraOnCloud.length;

    console.log(`\n=== ${courseId} ===`);
    console.log(`  Local export files (allowed ext): ${localIds.size}`);
    console.log(`  Cloudinary raw under ${prefix}: ${cloudIds.size}`);

    if (missingOnCloud.length) {
      console.log(`  NOT on Cloudinary (expected public_id):`);
      for (const id of missingOnCloud.sort()) console.log(`    - ${id}`);
    } else {
      console.log(`  All local files have a matching Cloudinary public_id.`);
    }

    if (extraOnCloud.length) {
      console.log(`  On Cloudinary but not in local export (older uploads / manual): ${extraOnCloud.length}`);
      for (const id of extraOnCloud.sort().slice(0, 15)) console.log(`    + ${id}`);
      if (extraOnCloud.length > 15) console.log(`    ... and ${extraOnCloud.length - 15} more`);
    }
  }

  console.log("\n--- totals ---");
  console.log(`Local files counted: ${totalLocal}`);
  console.log(`Missing on Cloudinary: ${totalMissingOnCloud}`);
  console.log(`Extra on Cloudinary (vs export): ${totalExtraOnCloud}`);
  if (totalMissingOnCloud === 0) {
    console.log("OK: every export file maps to a Cloudinary asset with the same public_id.");
  } else {
    console.log("Run: pnpm tsx scripts/reupload-courses-from-export.ts --apply");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
