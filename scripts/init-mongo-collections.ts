/**
 * Create every collection the KSOSHTC API uses (if missing) and ensure indexes.
 * Contact form data lives in `inquiries` (shown in Atlas as collection "inquiries").
 *
 *   pnpm exec tsx scripts/init-mongo-collections.ts
 *
 * Requires MONGODB_URI in backend/.env (optional MONGODB_DB).
 */
import { scriptMongoConnect } from "./lib/mongo-script";
import { MONGO_COLLECTIONS } from "../backend/lib/mongo";

async function ensureCollection(db: import("mongodb").Db, name: string): Promise<void> {
  const found = await db.listCollections({ name }, { nameOnly: true }).toArray();
  if (found.length === 0) {
    await db.createCollection(name);
    console.log(`[init] created collection: ${name}`);
  } else {
    console.log(`[init] collection exists: ${name}`);
  }
}

async function tryIndex(
  fn: () => Promise<string>
): Promise<void> {
  try {
    await fn();
  } catch {
    /* index may already exist with different options */
  }
}

async function main(): Promise<void> {
  const { client, db } = await scriptMongoConnect();
  const dbName = db.databaseName;
  console.log(`[init] database: ${dbName}`);

  const names = Object.values(MONGO_COLLECTIONS);
  for (const name of names) {
    await ensureCollection(db, name);
  }

  const courses = db.collection(MONGO_COLLECTIONS.courses);
  const modules = db.collection(MONGO_COLLECTIONS.modules);
  const lessons = db.collection(MONGO_COLLECTIONS.lessons);
  const assessments = db.collection(MONGO_COLLECTIONS.assessments);
  const testimonials = db.collection(MONGO_COLLECTIONS.testimonials);
  const users = db.collection(MONGO_COLLECTIONS.users);
  const enrollments = db.collection(MONGO_COLLECTIONS.enrollments);
  const progress = db.collection(MONGO_COLLECTIONS.progress);
  const submissions = db.collection(MONGO_COLLECTIONS.submissions);
  const assignmentSubs = db.collection(MONGO_COLLECTIONS.assignment_submissions);
  const passwordResets = db.collection(MONGO_COLLECTIONS.password_resets);
  const quizzes = db.collection(MONGO_COLLECTIONS.quizzes);
  const inquiries = db.collection(MONGO_COLLECTIONS.inquiries);

  await tryIndex(() => courses.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => modules.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => modules.createIndex({ courseId: 1, order: 1 }));
  await tryIndex(() => lessons.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => lessons.createIndex({ courseId: 1, moduleId: 1, order: 1 }));
  await tryIndex(() => assessments.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => assessments.createIndex({ courseId: 1, moduleId: 1, order: 1 }));
  await tryIndex(() => testimonials.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => users.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => users.createIndex({ email: 1 }, { unique: true }));
  await tryIndex(() => enrollments.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => enrollments.createIndex({ userId: 1, courseId: 1 }));
  await tryIndex(() => progress.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => progress.createIndex({ userId: 1 }));
  await tryIndex(() => submissions.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => submissions.createIndex({ userId: 1 }));
  await tryIndex(() => assignmentSubs.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => passwordResets.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => quizzes.createIndex({ courseId: 1 }, { unique: true }));
  await tryIndex(() => inquiries.createIndex({ id: 1 }, { unique: true }));
  await tryIndex(() => inquiries.createIndex({ createdAt: -1 }));

  console.log("[init] indexes ensured (skipped if already present).");
  console.log("[init] done.");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
