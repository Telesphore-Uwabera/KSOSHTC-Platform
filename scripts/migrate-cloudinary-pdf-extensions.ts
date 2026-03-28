/**
 * Re-upload Cloudinary raw course PDFs so public_id ends with .pdf (fixes Format N/A in console)
 * and update Firestore lesson pdfUrl values to the new secure_url.
 *
 * For each raw asset under ksohtc/courses/ whose public_id does not end with .pdf:
 *   fetch bytes → upload as application/pdf with stem.pdf → delete old → patch lessons.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-cloudinary-pdf-extensions.ts           # dry-run
 *   pnpm tsx scripts/migrate-cloudinary-pdf-extensions.ts --apply    # Cloudinary + MongoDB
 *
 * Requires backend/.env: CLOUDINARY_* and MONGODB_URI.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { scriptMongoConnect } from "./lib/mongo-script";
import { MONGO_COLLECTIONS } from "../backend/lib/mongo";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const APPLY = process.argv.includes("--apply");

type RawRes = { public_id: string; secure_url: string };

function extractRawPublicIdFromUrl(urlStr: string): string | null {
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith("http")) return null;
  try {
    const u = new URL(trimmed);
    // Path shape: /{cloud_name}/raw/upload[/v123]/public_id…
    const m = u.pathname.match(/.+\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (!m?.[1]) return null;
    return decodeURIComponent(m[1].split("?")[0] || "");
  } catch {
    return null;
  }
}

async function listAllCourseRaw(): Promise<RawRes[]> {
  const prefix = "ksohtc/courses";
  const out: RawRes[] = [];
  let next_cursor: string | undefined;
  do {
    const r = (await cloudinary.api.resources({
      type: "upload",
      resource_type: "raw",
      prefix,
      max_results: 500,
      ...(next_cursor ? { next_cursor } : {}),
    })) as { resources?: RawRes[]; next_cursor?: string };
    for (const res of r.resources ?? []) {
      if (res.public_id && res.secure_url) out.push(res);
    }
    next_cursor = r.next_cursor;
  } while (next_cursor);
  return out;
}

function splitPublicId(full: string): { folder: string; stem: string } {
  const i = full.lastIndexOf("/");
  if (i < 0) return { folder: "", stem: full };
  return { folder: full.slice(0, i), stem: full.slice(i + 1) };
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

  const all = await listAllCourseRaw();
  const targets = all.filter((r) => !r.public_id.toLowerCase().endsWith(".pdf"));

  console.log(`Total raw under ksohtc/courses: ${all.length}`);
  console.log(`Need .pdf suffix on public_id: ${targets.length}`);
  if (targets.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (!APPLY) {
    for (const t of targets) {
      const { stem } = splitPublicId(t.public_id);
      console.log(`[DRY-RUN] ${t.public_id} → …/${stem}.pdf`);
    }
    console.log("\nPass --apply to re-upload, update MongoDB, and delete old assets.");
    return;
  }

  /** old public_id → new secure_url (after successful upload) */
  const idToNewUrl = new Map<string, string>();

  for (let i = 0; i < targets.length; i++) {
    const asset = targets[i];
    const { folder, stem } = splitPublicId(asset.public_id);
    const newStem = `${stem}.pdf`;

    process.stdout.write(`[${i + 1}/${targets.length}] ${asset.public_id} … `);

    const resFetch = await fetch(asset.secure_url, { redirect: "follow" });
    if (!resFetch.ok) {
      console.log(`SKIP fetch failed HTTP ${resFetch.status}`);
      continue;
    }
    const buf = Buffer.from(await resFetch.arrayBuffer());
    if (buf.length < 4 || buf.subarray(0, 4).toString("ascii") !== "%PDF") {
      console.log("SKIP not a PDF (magic)");
      continue;
    }

    const uri = `data:application/pdf;base64,${buf.toString("base64")}`;
    let newUrl: string;
    try {
      const up = await cloudinary.uploader.upload(uri, {
        folder,
        public_id: newStem,
        resource_type: "raw",
      });
      if (!up.secure_url) {
        console.log("SKIP upload missing secure_url");
        continue;
      }
      newUrl = up.secure_url;
    } catch (e) {
      console.log(`SKIP upload ${e instanceof Error ? e.message : e}`);
      continue;
    }

    try {
      await cloudinary.uploader.destroy(asset.public_id, {
        resource_type: "raw",
        invalidate: true,
      } as Record<string, unknown>);
    } catch (e) {
      console.log(`WARN destroy old failed: ${e instanceof Error ? e.message : e}`);
    }

    idToNewUrl.set(asset.public_id, newUrl);
    console.log("OK");
    await new Promise((r) => setTimeout(r, 150));
  }

  let lessonsUpdated = 0;

  const { client, db } = await scriptMongoConnect();
  try {
    const lessonsCol = db.collection(MONGO_COLLECTIONS.lessons);
    const withHttp = await lessonsCol.find({ pdfUrl: { $regex: /^https/ } }).toArray();

    for (const row of withHttp) {
      const pdfUrl = (row.pdfUrl ?? "").toString().trim();
      if (!pdfUrl || !pdfUrl.startsWith("http")) continue;

      const pid = extractRawPublicIdFromUrl(pdfUrl);
      if (!pid) continue;
      const replacement = idToNewUrl.get(pid);
      if (!replacement || replacement === pdfUrl) continue;

      const lessonId = row.id as string;
      await lessonsCol.updateOne({ id: lessonId }, { $set: { pdfUrl: replacement } });
      lessonsUpdated++;
      console.log(`Mongo lesson ${lessonId} pdfUrl → new URL`);
    }
  } finally {
    await client.close();
  }

  console.log("\n--- summary (APPLY) ---");
  console.log(`Assets re-uploaded with .pdf: ${idToNewUrl.size}`);
  console.log(`Lesson pdfUrl fields updated: ${lessonsUpdated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
