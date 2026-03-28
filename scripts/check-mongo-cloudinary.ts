/**
 * Quick check: count docs in Mongo and sample Cloudinary URLs in lessons/courses.
 * Run: pnpm exec tsx scripts/check-mongo-cloudinary.ts
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { MongoClient } from "mongodb";
import { MONGO_COLLECTIONS } from "../backend/lib/mongo";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const dbName =
  process.env.MONGODB_DB?.trim() ||
  (() => {
    try {
      const u = new URL(uri);
      return u.pathname?.replace(/^\//, "").trim() || "ksoshtc";
    } catch {
      return "ksoshtc";
    }
  })();

const cloudinaryRe = /cloudinary\.com/i;

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const col = (name: string) => db.collection(name).countDocuments();
  const entries = await Promise.all(
    Object.entries(MONGO_COLLECTIONS).map(async ([key, name]) => [key, name, await col(name)] as const)
  );

  console.log(`DB: ${dbName}`);
  console.log("Collection counts (API collections):");
  for (const [, name, n] of entries.sort((a, b) => a[1].localeCompare(b[1]))) {
    console.log(`  ${name}: ${n}`);
  }
  console.log("(Contact form → inquiries; learner accounts → users.)");

  const sampleLesson = await db.collection(MONGO_COLLECTIONS.lessons).findOne({ pdfUrl: { $exists: true, $ne: "" } });
  const sampleCourse = await db.collection(MONGO_COLLECTIONS.courses).findOne({
    $or: [{ coverImageUrl: { $exists: true } }, { coverImageUrl: { $ne: "" } }],
  });

  const lessonUrl = sampleLesson?.pdfUrl as string | undefined;
  const coverUrl = sampleCourse?.coverImageUrl as string | undefined;

  if (lessonUrl) {
    console.log(`Sample lesson pdfUrl: ${lessonUrl.slice(0, 80)}…`);
    console.log(`Looks like Cloudinary: ${cloudinaryRe.test(lessonUrl)}`);
  } else {
    console.log("No lesson with pdfUrl found.");
  }
  if (coverUrl) {
    console.log(`Sample course coverImageUrl: ${coverUrl.slice(0, 80)}…`);
    console.log(`Looks like Cloudinary: ${cloudinaryRe.test(coverUrl)}`);
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
