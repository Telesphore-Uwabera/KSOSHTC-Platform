/**
 * List Cloudinary assets under ksohtc/courses/* (raw + image), detect non-PDF via file magic (%PDF),
 * optionally delete them so only true PDFs remain in course folders.
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-cloudinary-nonpdf-courses.ts           # dry-run: list non-PDFs
 *   pnpm tsx scripts/cleanup-cloudinary-nonpdf-courses.ts --apply    # delete non-PDF assets
 *
 * After --apply, update Firestore lessons whose pdfUrl pointed at deleted assets (re-upload PDFs).
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

const APPLY = process.argv.includes("--apply");

type ResourceType = "raw" | "image";

type Listed = { public_id: string; secure_url?: string; format?: string };

async function listResources(prefix: string, resourceType: ResourceType): Promise<Listed[]> {
  const out: Listed[] = [];
  let next_cursor: string | undefined;
  do {
    const r = (await cloudinary.api.resources({
      type: "upload",
      resource_type: resourceType,
      prefix,
      max_results: 500,
      ...(next_cursor ? { next_cursor } : {}),
    })) as { resources?: Listed[]; next_cursor?: string };
    for (const res of r.resources ?? []) {
      if (res.public_id) out.push({ public_id: res.public_id, secure_url: res.secure_url, format: res.format });
    }
    next_cursor = r.next_cursor;
  } while (next_cursor);
  return out;
}

function isPdfMagic(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
}

/** Read only the first chunk(s) until we have 4+ bytes or stream ends; then cancel reader. */
async function sniffPdfFromUrl(url: string): Promise<"pdf" | "not_pdf" | "error"> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok || !res.body) return "error";
    const reader = res.body.getReader();
    const chunks: Buffer[] = [];
    let total = 0;
    while (total < 8) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.length) {
        chunks.push(Buffer.from(value));
        total += value.length;
      }
    }
    await reader.cancel().catch(() => {});
    const buf = Buffer.concat(chunks);
    if (buf.length < 4) return "not_pdf";
    return isPdfMagic(buf) ? "pdf" : "not_pdf";
  } catch {
    return "error";
  }
}

async function deleteBatch(publicIds: string[], resourceType: ResourceType): Promise<void> {
  const chunk = 100;
  for (let i = 0; i < publicIds.length; i += chunk) {
    const slice = publicIds.slice(i, i + chunk);
    const r = await cloudinary.api.delete_resources(slice, {
      resource_type: resourceType,
      type: "upload",
      invalidate: true,
    } as Record<string, unknown>);
    console.log(`  delete_resources (${resourceType}):`, JSON.stringify(r));
  }
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

  const toDeleteRaw: string[] = [];
  const toDeleteImage: string[] = [];
  let checked = 0;
  let pdfCount = 0;
  let errorCount = 0;

  for (const prefix of PREFIXES) {
    for (const rt of ["raw", "image"] as ResourceType[]) {
      const list = await listResources(prefix, rt);
      if (list.length === 0) continue;
      console.log(`\n${prefix} [${rt}]: ${list.length} asset(s)`);

      for (const item of list) {
        const url = item.secure_url;
        if (!url) {
          console.log(`  [skip] no secure_url: ${item.public_id}`);
          errorCount++;
          continue;
        }
        checked++;
        const kind = await sniffPdfFromUrl(url);
        if (kind === "error") {
          console.log(`  [error] could not sniff: ${item.public_id}`);
          errorCount++;
          continue;
        }
        if (kind === "pdf") {
          pdfCount++;
          continue;
        }
        console.log(`  [non-PDF] ${item.public_id} format=${item.format ?? "?"}`);
        if (rt === "raw") toDeleteRaw.push(item.public_id);
        else toDeleteImage.push(item.public_id);
      }
    }
  }

  console.log("\n--- summary ---");
  console.log(`Checked: ${checked}, confirmed PDF: ${pdfCount}, non-PDF listed: ${toDeleteRaw.length + toDeleteImage.length}, sniff errors: ${errorCount}`);

  if (toDeleteRaw.length + toDeleteImage.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  if (!APPLY) {
    console.log("\nDRY-RUN: pass --apply to delete non-PDF assets from Cloudinary.");
    return;
  }

  if (toDeleteRaw.length) {
    console.log(`\nDeleting ${toDeleteRaw.length} raw asset(s)...`);
    await deleteBatch(toDeleteRaw, "raw");
  }
  if (toDeleteImage.length) {
    console.log(`\nDeleting ${toDeleteImage.length} image asset(s) under course folders...`);
    await deleteBatch(toDeleteImage, "image");
  }
  console.log("\nDone. Fix any Firestore lesson pdfUrl fields that pointed at removed files.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
