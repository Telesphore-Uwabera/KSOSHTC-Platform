/**
 * Download raw (PDF/doc) files from Cloudinary for one course folder at a time.
 *
 * Usage:
 *   pnpm tsx scripts/download-cloudinary-course-raw.ts construction
 *   pnpm tsx scripts/download-cloudinary-course-raw.ts industrial-safety
 *   pnpm tsx scripts/download-cloudinary-course-raw.ts mining
 *   pnpm tsx scripts/download-cloudinary-course-raw.ts safety-management
 *
 * Output: downloads/cloudinary-export/<courseId>/
 *
 * Requires backend/.env (CLOUDINARY_*).
 */
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const VALID = new Set(["construction", "industrial-safety", "mining", "safety-management"]);

type CloudResource = {
  public_id: string;
  secure_url: string;
  format?: string;
  original_filename?: string;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim() || "file";
}

async function fetchAllRaw(prefix: string): Promise<CloudResource[]> {
  const out: CloudResource[] = [];
  let next_cursor: string | undefined;
  do {
    const r = (await cloudinary.api.resources({
      type: "upload",
      resource_type: "raw",
      prefix,
      max_results: 500,
      ...(next_cursor ? { next_cursor } : {}),
    })) as { resources?: CloudResource[]; next_cursor?: string };
    for (const res of r.resources ?? []) {
      if (res.public_id && res.secure_url) out.push(res);
    }
    next_cursor = r.next_cursor;
  } while (next_cursor);
  return out;
}

function pickLocalName(res: CloudResource): string {
  const tail = res.public_id.split("/").pop() || "file";
  let base = sanitizeFileName(tail);
  const hasExt = /\.[a-zA-Z0-9]{2,8}$/.test(base);
  if (!hasExt) {
    const fromUrl = res.secure_url.split("/").pop()?.split("?")[0] || "";
    const urlExt = path.extname(fromUrl);
    if (urlExt && urlExt.length <= 10) base += urlExt;
    else if (res.format) base += `.${res.format}`;
    else base += ".bin";
  }
  return base;
}

function extFromContentType(ct: string | null): string | null {
  if (!ct) return null;
  const main = ct.split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "text/plain": ".txt",
    "text/csv": ".csv",
  };
  return map[main] ?? null;
}

function extFromMagic(buf: Buffer): string | null {
  if (buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF") return ".pdf";
  return null;
}

async function downloadUrl(url: string, destPath: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ctExt = extFromContentType(res.headers.get("content-type"));
  const magicExt = extFromMagic(buf);
  let finalPath = destPath;
  if (destPath.endsWith(".bin")) {
    const ext = ctExt ?? magicExt ?? ".bin";
    if (ext !== ".bin") {
      finalPath = destPath.slice(0, -4) + ext;
    }
  }
  await fs.promises.writeFile(finalPath, buf);
  return path.basename(finalPath);
}

async function main(): Promise<void> {
  const courseId = (process.argv[2] || "construction").trim();
  if (!VALID.has(courseId)) {
    console.error(`Usage: pnpm tsx scripts/download-cloudinary-course-raw.ts <courseId>`);
    console.error(`Valid courseId: ${[...VALID].join(", ")}`);
    process.exit(1);
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Missing CLOUDINARY_* in backend/.env");
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const prefix = `ksohtc/courses/${courseId}`;
  const outDir = path.resolve(process.cwd(), "downloads", "cloudinary-export", courseId);
  await fs.promises.mkdir(outDir, { recursive: true });

  console.log(`Listing Cloudinary prefix: ${prefix}`);
  const resources = await fetchAllRaw(prefix);
  console.log(`Found ${resources.length} raw file(s). Downloading to:\n  ${outDir}\n`);

  let ok = 0;
  let fail = 0;
  const usedNames = new Map<string, number>();

  for (let i = 0; i < resources.length; i++) {
    const res = resources[i];
    let name = pickLocalName(res);
    const count = (usedNames.get(name) ?? 0) + 1;
    usedNames.set(name, count);
    if (count > 1) {
      const ext = path.extname(name);
      const stem = ext ? name.slice(0, -ext.length) : name;
      name = `${stem} (${count})${ext || ""}`;
    }

    const dest = path.join(outDir, name);
    try {
      process.stdout.write(`[${i + 1}/${resources.length}] ${name} ... `);
      const savedAs = await downloadUrl(res.secure_url, dest);
      if (savedAs !== name) console.log(`OK → ${savedAs}`);
      else console.log("OK");
      ok++;
    } catch (e) {
      console.log(`FAIL ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }

  console.log(`\nDone. OK: ${ok}, failed: ${fail}`);
  console.log(`Next course: pnpm tsx scripts/download-cloudinary-course-raw.ts industrial-safety`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
