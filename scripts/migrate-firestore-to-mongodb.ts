import path from "node:path";
import { config as loadEnv } from "dotenv";
import { MongoClient } from "mongodb";
import { getDb } from "../backend/lib/firestore";
import { MONGO_COLLECTIONS } from "../backend/lib/mongo";
import type { CourseDoc, ModuleDoc, LessonDoc, AssessmentDoc, Testimonial } from "../shared/api";

type AnyDoc = Record<string, any>;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}. Set it in backend/.env or your shell env before running the script.`);
  return v;
}

function stripMongoId<T extends AnyDoc>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  return rest as any;
}

async function migrate(): Promise<void> {
  // Load backend env for local runs
  loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

  const mongoUri = requireEnv("MONGODB_URI");
  const mongoDbName =
    process.env.MONGODB_DB?.trim() ||
    (() => {
      try {
        const u = new URL(mongoUri);
        const name = u.pathname?.replace(/^\//, "").trim();
        return name || "ksoshtc";
      } catch {
        return "ksoshtc";
      }
    })();

  console.log(`[MIGRATE] MongoDB target: db="${mongoDbName}"`);

  const mongoClient = new MongoClient(mongoUri, { retryWrites: true });
  await mongoClient.connect();
  const mdb = mongoClient.db(mongoDbName);

  const coursesCol = mdb.collection<CourseDoc>(MONGO_COLLECTIONS.courses);
  const modulesCol = mdb.collection<ModuleDoc>(MONGO_COLLECTIONS.modules);
  const lessonsCol = mdb.collection<LessonDoc>(MONGO_COLLECTIONS.lessons);
  const assessmentsCol = mdb.collection<AssessmentDoc>(MONGO_COLLECTIONS.assessments);
  const testimonialsCol = mdb.collection<Testimonial>(MONGO_COLLECTIONS.testimonials);

  // Helpful indexes (id is our stable key)
  await Promise.all([
    coursesCol.createIndex({ id: 1 }, { unique: true }),
    modulesCol.createIndex({ id: 1 }, { unique: true }),
    lessonsCol.createIndex({ id: 1 }, { unique: true }),
    assessmentsCol.createIndex({ id: 1 }, { unique: true }),
    testimonialsCol.createIndex({ id: 1 }, { unique: true }),
    modulesCol.createIndex({ courseId: 1, order: 1 }),
    lessonsCol.createIndex({ courseId: 1, moduleId: 1, order: 1 }),
    assessmentsCol.createIndex({ courseId: 1, moduleId: 1, order: 1 }),
  ]);

  const db = getDb();

  // 1) Courses (top-level)
  console.log("[MIGRATE] Reading courses from Firestore…");
  const coursesSnap = await db.collection("courses").get();
  const courseDocs = coursesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyDoc) })) as CourseDoc[];
  console.log(`[MIGRATE] Found ${courseDocs.length} courses`);

  let moduleCount = 0;
  let lessonCount = 0;
  let assessmentCount = 0;

  // Upsert courses
  if (courseDocs.length) {
    await coursesCol.bulkWrite(
      courseDocs.map((c) => ({
        updateOne: {
          filter: { id: c.id },
          update: { $set: stripMongoId(c as any) },
          upsert: true,
        },
      }))
    );
  }

  // 2) Subcollections: modules -> lessons + assessments
  for (const c of coursesSnap.docs) {
    const courseId = c.id;
    const modulesSnap = await db.collection("courses").doc(courseId).collection("modules").get();
    const modules = modulesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyDoc) })) as ModuleDoc[];
    moduleCount += modules.length;

    if (modules.length) {
      await modulesCol.bulkWrite(
        modules.map((m) => ({
          updateOne: {
            filter: { id: m.id },
            update: { $set: stripMongoId(m as any) },
            upsert: true,
          },
        }))
      );
    }

    for (const m of modulesSnap.docs) {
      const moduleId = m.id;

      const lessonsSnap = await db
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .doc(moduleId)
        .collection("lessons")
        .get();
      const lessons = lessonsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyDoc) })) as LessonDoc[];
      lessonCount += lessons.length;

      if (lessons.length) {
        await lessonsCol.bulkWrite(
          lessons.map((l) => ({
            updateOne: {
              filter: { id: l.id },
              update: { $set: stripMongoId(l as any) },
              upsert: true,
            },
          }))
        );
      }

      const assessmentsSnap = await db
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .doc(moduleId)
        .collection("assessments")
        .get();
      const assessments = assessmentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyDoc) })) as AssessmentDoc[];
      assessmentCount += assessments.length;

      if (assessments.length) {
        await assessmentsCol.bulkWrite(
          assessments.map((a) => ({
            updateOne: {
              filter: { id: a.id },
              update: { $set: stripMongoId(a as any) },
              upsert: true,
            },
          }))
        );
      }
    }
  }

  // 3) Testimonials
  console.log("[MIGRATE] Reading testimonials from Firestore…");
  const tSnap = await db.collection("testimonials").get();
  const testimonials = tSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyDoc) })) as Testimonial[];
  console.log(`[MIGRATE] Found ${testimonials.length} testimonials`);
  if (testimonials.length) {
    await testimonialsCol.bulkWrite(
      testimonials.map((t) => ({
        updateOne: {
          filter: { id: t.id },
          update: { $set: stripMongoId(t as any) },
          upsert: true,
        },
      }))
    );
  }

  console.log(
    `[MIGRATE] Done. Upserted courses=${courseDocs.length}, modules=${moduleCount}, lessons=${lessonCount}, assessments=${assessmentCount}, testimonials=${testimonials.length}`
  );

  await mongoClient.close();
}

migrate().catch((e) => {
  console.error("[MIGRATE] Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});

