import { Request, Response } from "express";
import path from "node:path";
import crypto from "node:crypto";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import type {
  CourseDoc,
  CourseId,
  ModuleDoc,
  LessonDoc,
  AssessmentDoc,
  QuizQuestion,
  User,
} from "@shared/api";
import { isValidCourseSlug } from "../lib/course-constants";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { notifyLearnerModuleQuizResult } from "../lib/notify";
import { getBearerToken, isAdminSessionAuthorized, verifyAdminSessionToken } from "../lib/adminSession";
import { getActiveInstructorByUserId, getStaffSessionPayload, requireInstructorCourseAccess } from "../lib/instructorAccess";

function omitMongoId<T extends { _id?: unknown }>(doc: T | null | undefined): Omit<T, "_id"> | null {
  if (doc == null) return null;
  const { _id, ...rest } = doc;
  return rest as Omit<T, "_id">;
}
import type { SubmissionDoc, ProgressDoc } from "@shared/api";
import { normalizeCloudinaryCourseUrl } from "../../shared/normalizeCloudinaryUrl";
import { isAllowedUploadExtension, mimeFromExtension } from "../../shared/allowedUploads.ts";
import { v2 as cloudinary } from "cloudinary";

/** All courses display duration as 3 months. */
const DISPLAY_DURATION = "3 months";
const COURSES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let coursesCache: { fetchedAt: number; data: CourseDoc[] } | null = null;

/** POST /api/course-content/courses/:courseId/upload-pdf – admin upload course PDF only. Body: { filename: string, contentBase64: string } */
export async function uploadCoursePdf(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      res.status(400).json({ error: "courseId is required." });
      return;
    }
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as { filename?: string; contentBase64?: string };
    const filename = typeof body.filename === "string" ? body.filename.trim() : "";
    const contentBase64 = body.contentBase64;
    if (!filename || !contentBase64) {
      res.status(400).json({ error: "filename and contentBase64 are required." });
      return;
    }
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
    const ext = path.extname(safeName).toLowerCase();
    if (!isAllowedUploadExtension(ext)) {
      res.status(400).json({
        error: `This file type is not allowed for course materials (got ${ext || "none"}). Use PDF, Office, images, or other supported formats.`,
      });
      return;
    }
    const buf = Buffer.from(contentBase64, "base64");
    if (buf.length > 50 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 50MB)." });
      return;
    }

    const mime = mimeFromExtension(ext);
    const uri = `data:${mime};base64,${contentBase64}`;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const publicId = `${path.parse(safeName).name}${ext}`;
    const result = await cloudinary.uploader.upload(uri, {
      folder: `ksohtc/courses/${courseId}`,
      public_id: publicId,
      resource_type: "raw",
    });
    
    const pdfUrl = result.secure_url;
    res.status(201).json({ ok: true, filename: safeName, pdfUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
    console.error("uploadCoursePdf:", msg);
    res.status(500).json({ error: "Failed to upload document.", detail: msg });
  }
}

const COVER_IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** POST /api/course-content/courses/:courseId/cover-image – admin upload course thumbnail. Body: { contentBase64: string, contentType?: "image/jpeg"|"image/png"|"image/webp" }. Returns coverImageUrl and updates course. */
export async function uploadCourseCover(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as { contentBase64?: string; contentType?: string };
    const contentBase64 = body.contentBase64;
    if (!contentBase64) {
      res.status(400).json({ error: "contentBase64 is required." });
      return;
    }
    const contentType = (body.contentType ?? "image/jpeg").toLowerCase();
    const ext = COVER_IMAGE_TYPES[contentType] ?? "jpg";
    const filename = `${courseId}.${ext}`;
    const buf = Buffer.from(contentBase64, "base64");
    if (buf.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "Image too large (max 5MB)." });
      return;
    }
    
    const uri = `data:${contentType};base64,${contentBase64}`;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.uploader.upload(uri, {
      folder: "ksohtc/course-covers",
      public_id: courseId,
      resource_type: "image",
    });
    
    const coverImageUrl = result.secure_url;

    const now = new Date().toISOString();
    await mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses).updateOne(
      { id: courseId },
      { $set: { coverImageUrl, updatedAt: now } }
    );
    coursesCache = null;

    res.status(201).json({ ok: true, coverImageUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("uploadCourseCover:", msg);
    res.status(500).json({ error: "Failed to upload cover image.", detail: msg });
  }
}

/** GET /api/course-content/courses – list all courses from MongoDB */
export async function listCourses(_req: Request, res: Response): Promise<void> {
  try {
    const staff = verifyAdminSessionToken(getBearerToken(_req));
    if (staff.ok && staff.payload.role === "instructor") {
      const inst = await getActiveInstructorByUserId(staff.payload.userId);
      const allowed = new Set(inst?.allowedCourseIds ?? []);
      if (allowed.size === 0) {
        res.json({ courses: [] });
        return;
      }
      const col = mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
      const raw = await col.find({ id: { $in: [...allowed] } }).sort({ order: 1 }).toArray();
      const courses: CourseDoc[] = raw.map((c) => ({ ...c, duration: DISPLAY_DURATION }));
      res.setHeader("Cache-Control", "no-store");
      res.json({ courses });
      return;
    }

    if (coursesCache && Date.now() - coursesCache.fetchedAt < COURSES_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
      res.json({ courses: coursesCache.data });
      return;
    }
    const col = mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
    const raw = await col.find({}).sort({ order: 1 }).toArray();
    const courses: CourseDoc[] = raw.map((c) => ({ ...c, duration: DISPLAY_DURATION }));
    coursesCache = { fetchedAt: Date.now(), data: courses };
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
    res.json({ courses });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("listCourses:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to list courses." });
  }
}

/** GET /api/course-content/courses/:courseId – get one course doc */
export async function getCourse(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const doc = await mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses).findOne({ id: courseId });
    if (!doc) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const out = omitMongoId(doc);
    res.json(out);
  } catch (e) {
    console.error("getCourse:", e);
    res.status(500).json({ error: "Failed to get course." });
  }
}

/** POST /api/course-content/courses – create course (admin) */
export async function createCourse(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { slug?: string; title: string; description?: string; sector?: string; duration?: string };
    const slug = (body.slug ?? "").trim() as CourseId;
    if (!slug || !isValidCourseSlug(slug)) {
      res.status(400).json({ error: "Valid slug required: construction | industrial-safety | mining | safety-management | safety-for-all" });
      return;
    }
    const now = new Date().toISOString();
    const col = mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
    const existing = await col.findOne({ id: slug });
    if (existing) {
      res.status(409).json({ error: "Course with this slug already exists." });
      return;
    }
    const data: CourseDoc = {
      id: slug,
      slug,
      title: String(body.title ?? "Untitled").trim(),
      description: String(body.description ?? "").trim(),
      sector: String(body.sector ?? "").trim(),
      duration: String(body.duration ?? "").trim(),
      published: false,
      order: 0,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(data as any);
    coursesCache = null;
    res.status(201).json(data);
  } catch (e) {
    console.error("createCourse:", e);
    res.status(500).json({ error: "Failed to create course." });
  }
}

/** PUT /api/course-content/courses/:courseId – update course (admin) */
export async function updateCourse(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as Partial<Pick<CourseDoc, "title" | "description" | "sector" | "duration" | "coverImageUrl" | "published" | "order">>;
    const col = mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
    const snap = await col.findOne({ id: courseId });
    if (!snap) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = omitMongoId(snap) as CourseDoc;
    const updated: CourseDoc = {
      ...current,
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: String(body.description).trim() }),
      ...(body.sector !== undefined && { sector: String(body.sector).trim() }),
      ...(body.duration !== undefined && { duration: String(body.duration).trim() }),
      ...(body.coverImageUrl !== undefined && { coverImageUrl: body.coverImageUrl || undefined }),
      ...(body.published !== undefined && { published: Boolean(body.published) }),
      ...(body.order !== undefined && { order: Number(body.order) }),
      updatedAt: now,
    };
    await col.replaceOne({ id: courseId }, updated as any);
    coursesCache = null;
    res.json(updated);
  } catch (e) {
    console.error("updateCourse:", e);
    res.status(500).json({ error: "Failed to update course." });
  }
}

/** Return total lesson + assessment count for a course (for completion %) */
export async function getCourseTotalSteps(courseId: string): Promise<{ totalLessons: number; totalAssessments: number }> {
  const mods = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules)
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();
  let totalLessons = 0;
  let totalAssessments = 0;
  const lessonsCol = mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons);
  const assessmentsCol = mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments);
  for (const m of mods) {
    const [lc, ac] = await Promise.all([
      lessonsCol.countDocuments({ courseId, moduleId: m.id }),
      assessmentsCol.countDocuments({ courseId, moduleId: m.id }),
    ]);
    totalLessons += lc;
    totalAssessments += ac;
  }
  return { totalLessons, totalAssessments };
}

/** GET /api/course-content/courses/:courseId/stats – total lessons and assessments (for learner completion %) */
export async function getCourseStats(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    let stats = await getCourseTotalSteps(courseId);
    res.json(stats);
  } catch (e) {
    console.error("getCourseStats:", e);
    res.status(500).json({ error: "Failed to get course stats." });
  }
}

/** GET /api/course-content/courses/:courseId/modules – list modules */
export async function listModules(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const rows = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules)
      .find({ courseId })
      .sort({ order: 1 })
      .toArray();
    const modules = rows.map((d) => omitMongoId(d) as ModuleDoc);
    res.json({ modules });
  } catch (e) {
    console.error("listModules:", e);
    res.status(500).json({ error: "Failed to list modules." });
  }
}

/** POST /api/course-content/courses/:courseId/modules – add module (admin) */
export async function createModule(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as { title: string; order?: number };
    const courseSnap = await mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses).findOne({ id: courseId });
    if (!courseSnap) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const order = Number(body.order) ?? 0;
    const data: ModuleDoc = {
      id,
      courseId,
      title: String(body.title ?? "Untitled module").trim(),
      order,
      createdAt: now,
      updatedAt: now,
    };
    await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules).insertOne(data as any);
    res.status(201).json(data);
  } catch (e) {
    console.error("createModule:", e);
    res.status(500).json({ error: "Failed to create module." });
  }
}

/** PUT /api/course-content/courses/:courseId/modules/:moduleId – update module */
export async function updateModule(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as { title?: string; order?: number };
    const col = mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules);
    const snap = await col.findOne({ id: moduleId, courseId });
    if (!snap) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = omitMongoId(snap) as ModuleDoc;
    const updated: ModuleDoc = {
      ...current,
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.order !== undefined && { order: Number(body.order) }),
      updatedAt: now,
    };
    await col.replaceOne({ id: moduleId, courseId }, updated as any);
    res.json(updated);
  } catch (e) {
    console.error("updateModule:", e);
    res.status(500).json({ error: "Failed to update module." });
  }
}

/** DELETE /api/course-content/courses/:courseId/modules/:moduleId */
export async function deleteModule(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const modCol = mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules);
    const snap = await modCol.findOne({ id: moduleId, courseId });
    if (!snap) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons).deleteMany({ courseId, moduleId });
    await mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments).deleteMany({ courseId, moduleId });
    await modCol.deleteOne({ id: moduleId, courseId });
    res.status(204).send();
  } catch (e) {
    console.error("deleteModule:", e);
    res.status(500).json({ error: "Failed to delete module." });
  }
}

/** GET /api/course-content/courses/:courseId/modules/:moduleId/lessons */
export async function listLessons(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const rows = await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons)
      .find({ courseId, moduleId })
      .sort({ order: 1 })
      .toArray();
    const lessons = rows.map((d) => omitMongoId(d) as LessonDoc);
    res.json({ lessons });
  } catch (e) {
    console.error("listLessons:", e);
    res.status(500).json({ error: "Failed to list lessons." });
  }
}

/** POST /api/course-content/courses/:courseId/modules/:moduleId/lessons – add lesson (YouTube, pdfUrl, contentHtml) */
export async function createLesson(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as { title: string; order?: number; youtubeUrl?: string; pdfUrl?: string; contentHtml?: string };
    const moduleSnap = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules).findOne({ id: moduleId, courseId });
    if (!moduleSnap) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const rawData = {
      id,
      courseId,
      moduleId,
      title: String(body.title ?? "Untitled lesson").trim(),
      order: Number(body.order) ?? 0,
      youtubeUrl: typeof body.youtubeUrl === "string" && body.youtubeUrl.trim() ? body.youtubeUrl.trim() : undefined,
      pdfUrl: typeof body.pdfUrl === "string" && body.pdfUrl.trim() ? body.pdfUrl.trim() : undefined,
      contentHtml: typeof body.contentHtml === "string" ? body.contentHtml : "",
      published: true,
      createdAt: now,
      updatedAt: now,
    };
    const data = Object.fromEntries(Object.entries(rawData).filter(([, v]) => v !== undefined)) as unknown as LessonDoc;
    await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons).insertOne(data as any);
    res.status(201).json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
    console.error("createLesson:", msg);
    res.status(500).json({ error: "Failed to create lesson.", detail: msg });
  }
}

/** PUT /api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId */
export async function updateLesson(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as { title?: string; order?: number; youtubeUrl?: string; pdfUrl?: string; contentHtml?: string; published?: boolean };
    const col = mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons);
    const snap = await col.findOne({ id: lessonId, courseId, moduleId });
    if (!snap) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = omitMongoId(snap) as LessonDoc;
    const updated: LessonDoc = {
      ...current,
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.order !== undefined && { order: Number(body.order) }),
      ...(body.youtubeUrl !== undefined && { youtubeUrl: body.youtubeUrl?.trim() || undefined }),
      ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl?.trim() || undefined }),
      ...(body.contentHtml !== undefined && { contentHtml: body.contentHtml }),
      ...(body.published !== undefined && { published: Boolean(body.published) }),
      updatedAt: now,
    };
    await col.replaceOne({ id: lessonId, courseId, moduleId }, updated as any);
    res.json(updated);
  } catch (e) {
    console.error("updateLesson:", e);
    res.status(500).json({ error: "Failed to update lesson." });
  }
}

/** DELETE /api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId */
export async function deleteLesson(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const col = mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons);
    const r = await col.deleteOne({ id: lessonId, courseId, moduleId });
    if (r.deletedCount === 0) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    res.status(204).send();
  } catch (e) {
    console.error("deleteLesson:", e);
    res.status(500).json({ error: "Failed to delete lesson." });
  }
}

/** GET /api/course-content/courses/:courseId/modules/:moduleId/assessments */
export async function listAssessments(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const rows = await mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments)
      .find({ courseId, moduleId })
      .toArray();
    const assessments = rows
      .map((d) => omitMongoId(d) as AssessmentDoc)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json({ assessments });
  } catch (e) {
    console.error("listAssessments:", e);
    res.status(500).json({ error: "Failed to list assessments." });
  }
}

/** GET .../modules/:moduleId/items – ordered list of lessons and break quizzes (for gating next PDF) */
export async function getModuleItems(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const [lessonRows, assessmentRows] = await Promise.all([
      mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons)
        .find({ courseId, moduleId })
        .sort({ order: 1 })
        .toArray(),
      mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments).find({ courseId, moduleId }).toArray(),
    ]);
    const lessons: LessonDoc[] = lessonRows.map((d) => omitMongoId(d) as LessonDoc);
    const assessments: AssessmentDoc[] = assessmentRows
      .map((d) => omitMongoId(d) as AssessmentDoc)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const items: Array<{ type: "lesson"; data: LessonDoc } | { type: "assessment"; data: AssessmentDoc }> = [];
    for (const lesson of lessons) {
      items.push({ type: "lesson", data: lesson });
      const afterQuiz = assessments.filter((a) => a.afterLessonId === lesson.id);
      for (const a of afterQuiz) items.push({ type: "assessment", data: a });
    }
    const rest = assessments.filter((a) => !a.afterLessonId);
    for (const a of rest) items.push({ type: "assessment", data: a });
    res.json({ items });
  } catch (e) {
    console.error("getModuleItems:", e);
    res.status(500).json({ error: "Failed to get module items." });
  }
}

/** GET /api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId */
export async function getAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, assessmentId } = req.params;
    const doc = await mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments).findOne({
      id: assessmentId,
      courseId,
      moduleId,
    });
    if (!doc) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    res.json(omitMongoId(doc));
  } catch (e) {
    console.error("getAssessment:", e);
    res.status(500).json({ error: "Failed to get assessment." });
  }
}

/** POST /api/course-content/courses/:courseId/modules/:moduleId/assessments – add assessment (break quiz) */
export async function createAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as {
      title: string;
      description?: string;
      questions?: Array<{ text: string; options: string[]; correctIndex: number }>;
      passThreshold?: number;
      order?: number;
      afterLessonId?: string;
    };
    const moduleSnap = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules).findOne({ id: moduleId, courseId });
    if (!moduleSnap) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const questions: QuizQuestion[] = (body.questions ?? []).map((q) => ({
      id: crypto.randomUUID(),
      text: String(q.text ?? "").trim(),
      options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [],
      correctIndex: Math.max(0, Math.min(Number(q.correctIndex) ?? 0, (q.options?.length ?? 1) - 1)),
    }));
    const data: AssessmentDoc = {
      id,
      courseId,
      moduleId,
      title: String(body.title ?? "Break quiz").trim(),
      description: typeof body.description === "string" ? body.description : undefined,
      questions,
      passThreshold: Math.max(0, Math.min(100, Number(body.passThreshold) ?? 70)),
      published: true,
      order: body.order !== undefined ? Number(body.order) : 0,
      ...(body.afterLessonId && { afterLessonId: body.afterLessonId }),
      createdAt: now,
      updatedAt: now,
    };
    await mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments).insertOne(data as any);
    res.status(201).json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("createAssessment:", msg, e);
    res.status(500).json({ error: "Failed to create assessment.", detail: msg });
  }
}

/** PUT /api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId */
export async function updateAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, assessmentId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const body = req.body as {
      title?: string;
      description?: string;
      questions?: Array<{ id?: string; text: string; options: string[]; correctIndex: number }>;
      passThreshold?: number;
      published?: boolean;
      order?: number;
      afterLessonId?: string;
    };
    const col = mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments);
    const snap = await col.findOne({ id: assessmentId, courseId, moduleId });
    if (!snap) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = omitMongoId(snap) as AssessmentDoc;
    const questions: QuizQuestion[] =
      body.questions !== undefined
        ? body.questions.map((q) => ({
            id: q.id ?? crypto.randomUUID(),
            text: String(q.text ?? "").trim(),
            options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [],
            correctIndex: Math.max(0, Math.min(Number(q.correctIndex) ?? 0, (q.options?.length ?? 1) - 1)),
          }))
        : current.questions;
    const updated: AssessmentDoc = {
      ...current,
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: body.description }),
      questions,
      ...(body.passThreshold !== undefined && { passThreshold: Math.max(0, Math.min(100, Number(body.passThreshold))) }),
      ...(body.published !== undefined && { published: Boolean(body.published) }),
      ...(body.order !== undefined && { order: Number(body.order) }),
      ...(body.afterLessonId !== undefined && { afterLessonId: body.afterLessonId || undefined }),
      updatedAt: now,
    };
    await col.replaceOne({ id: assessmentId, courseId, moduleId }, updated as any);
    res.json(updated);
  } catch (e) {
    console.error("updateAssessment:", e);
    res.status(500).json({ error: "Failed to update assessment." });
  }
}

/** DELETE /api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId */
export async function deleteAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, assessmentId } = req.params;
    const gate = await requireInstructorCourseAccess(req, res, courseId);
    if (!gate.ok) return;
    const r = await mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments).deleteOne({
      id: assessmentId,
      courseId,
      moduleId,
    });
    if (r.deletedCount === 0) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    res.status(204).send();
  } catch (e) {
    console.error("deleteAssessment:", e);
    res.status(500).json({ error: "Failed to delete assessment." });
  }
}

/** POST .../assessments/:assessmentId/submit – submit quiz answers; server marks using correctIndex and updates progress */
export async function submitAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, assessmentId } = req.params;
    const body = req.body as { userId: string; answers: number[] };
    const { userId, answers } = body;
    if (!userId || !Array.isArray(answers)) {
      res.status(400).json({ error: "userId and answers (array) are required." });
      return;
    }
    const assessSnap = await mongoCollection<AssessmentDoc>(MONGO_COLLECTIONS.assessments).findOne({
      id: assessmentId,
      courseId,
      moduleId,
    });
    if (!assessSnap) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    const assessment = omitMongoId(assessSnap) as AssessmentDoc;
    const questions = assessment.questions ?? [];
    let correct = 0;
    questions.forEach((q, i) => {
      const selected = answers[i];
      if (selected === q.correctIndex) correct++;
    });
    const maxScore = questions.length;
    const score = correct;
    const percentage = maxScore > 0 ? Math.round((correct / maxScore) * 100) : 0;
    const passed = percentage >= (assessment.passThreshold ?? 70);
    const now = new Date().toISOString();
    const submissionId = crypto.randomUUID();
    const submission: SubmissionDoc = {
      id: submissionId,
      userId,
      courseId,
      moduleId,
      assessmentId,
      answers,
      score,
      maxScore,
      percentage,
      passed,
      submittedAt: now,
    };
    await mongoCollection<SubmissionDoc>(MONGO_COLLECTIONS.submissions).insertOne(submission as any);

    const [learner, courseDoc] = await Promise.all([
      mongoCollection<User>(MONGO_COLLECTIONS.users).findOne({ id: userId }),
      mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses).findOne({ id: courseId }),
    ]);
    const courseTitle = courseDoc?.title ?? courseId;
    if (learner?.email && learner.role !== "admin") {
      notifyLearnerModuleQuizResult({
        name: learner.name,
        email: learner.email,
        courseTitle,
        quizTitle: assessment.title,
        score,
        maxScore,
        percentage,
        passed,
        courseId,
      }).catch((err) => console.error("[QUIZ_SUBMIT] Notify learner failed:", err));
    }

    const progressId = `${userId}_${courseId}`;
    const progCol = mongoCollection<ProgressDoc>(MONGO_COLLECTIONS.progress);
    const progressSnap = await progCol.findOne({ id: progressId });
    const completedAssessmentIds = progressSnap
      ? [...(progressSnap.completedAssessmentIds ?? [])]
      : [];
    if (passed && !completedAssessmentIds.includes(assessmentId)) {
      completedAssessmentIds.push(assessmentId);
      let progressData: ProgressDoc;
      if (progressSnap) {
        const { _id: _mongoId, ...rest } = progressSnap as ProgressDoc & { _id?: unknown };
        progressData = { ...rest, completedAssessmentIds, updatedAt: now };
      } else {
        progressData = {
          id: progressId,
          userId,
          courseId,
          completedLessonIds: [],
          completedAssessmentIds,
          updatedAt: now,
        };
      }
      await progCol.replaceOne({ id: progressId }, progressData as any, { upsert: true });
    }

    res.status(201).json({ submission: { ...submission }, passed });
  } catch (e) {
    console.error("submitAssessment:", e);
    res.status(500).json({ error: "Failed to submit quiz." });
  }
}

/** GET /api/submissions?courseId= – list quiz submissions for a course (admin; for viewing learner marks). */
export async function getSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, userId } = req.query as { courseId?: string; userId?: string };
    const filter: Record<string, string> = {};
    if (courseId) filter.courseId = courseId;
    if (userId) filter.userId = userId;
    const staff = getStaffSessionPayload(req);
    if (staff?.role === "instructor") {
      if (!courseId) {
        res.status(400).json({ error: "courseId is required for instructors." });
        return;
      }
      const gate = await requireInstructorCourseAccess(req, res, courseId);
      if (!gate.ok) return;
    } else if (Object.keys(filter).length === 0 && !isAdminSessionAuthorized(req)) {
      res.status(401).json({ error: "Admin session required to list all quiz submissions." });
      return;
    }
    const list = await mongoCollection<SubmissionDoc>(MONGO_COLLECTIONS.submissions)
      .find(Object.keys(filter).length ? filter : {})
      .toArray();
    const submissions = list.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
    res.json({ submissions });
  } catch (e) {
    console.error("getSubmissions:", e);
    res.status(500).json({ error: "Failed to list submissions." });
  }
}

function streamContentTypeFromFilenameAndBytes(filenameRaw: string, firstBuf: Buffer): string {
  const ext = path.extname(filenameRaw).toLowerCase();
  const fromName = mimeFromExtension(ext);
  if (fromName !== "application/octet-stream") return fromName;
  if (
    firstBuf.length >= 4 &&
    firstBuf[0] === 0x25 &&
    firstBuf[1] === 0x50 &&
    firstBuf[2] === 0x44 &&
    firstBuf[3] === 0x46
  ) {
    return "application/pdf";
  }
  if (firstBuf.length >= 3 && firstBuf[0] === 0xff && firstBuf[1] === 0xd8 && firstBuf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    firstBuf.length >= 8 &&
    firstBuf[0] === 0x89 &&
    firstBuf[1] === 0x50 &&
    firstBuf[2] === 0x4e &&
    firstBuf[3] === 0x47
  ) {
    return "image/png";
  }
  if (firstBuf.length >= 6 && firstBuf[0] === 0x47 && firstBuf[1] === 0x49 && firstBuf[2] === 0x46) {
    return "image/gif";
  }
  if (firstBuf.length >= 4 && firstBuf[0] === 0x50 && firstBuf[1] === 0x4b) {
    return "application/octet-stream";
  }
  return "application/octet-stream";
}

/**
 * GET /api/course-content/stream-document?url=&filename=&download=1
 * Streams Cloudinary raw/image assets (course materials, assignment uploads, handouts) with correct headers.
 * Use download=1 for Content-Disposition: attachment (explicit download). Default is inline when possible.
 */
export async function streamCourseDocument(req: Request, res: Response): Promise<void> {
  try {
    const urlStr = normalizeCloudinaryCourseUrl(
      typeof req.query.url === "string" ? req.query.url.trim() : ""
    );
    const filenameRaw = typeof req.query.filename === "string" ? req.query.filename.trim() : "";
    const wantDownload =
      req.query.download === "1" || req.query.download === "true" || req.query.download === "yes";

    if (!urlStr) {
      res.status(400).json({ error: "Query parameter url is required." });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    if (!cloudName) {
      res.status(500).json({ error: "Server misconfiguration (Cloudinary)." });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      res.status(400).json({ error: "Invalid url." });
      return;
    }

    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith("res.cloudinary.com")) {
      res.status(403).json({ error: "URL host not allowed." });
      return;
    }

    const p = parsed.pathname;
    const pathAllowed =
      p.includes("/ksohtc/courses/") ||
      p.includes("/ksohtc/assignment-submissions/") ||
      p.includes("/ksohtc/admin-assignments/");
    if (!pathAllowed) {
      res.status(403).json({ error: "URL path not allowed." });
      return;
    }

    const firstSeg = p.split("/").filter(Boolean)[0];
    if (firstSeg !== cloudName) {
      res.status(403).json({ error: "Cloudinary account mismatch." });
      return;
    }

    if (!p.includes("/raw/upload/") && !p.includes("/image/upload/")) {
      res.status(403).json({ error: "Resource delivery type not allowed." });
      return;
    }

    const upstream = await fetch(urlStr, { redirect: "follow" });
    if (!upstream.ok) {
      res.status(502).json({ error: "Failed to fetch document from storage." });
      return;
    }
    if (!upstream.body) {
      res.status(502).json({ error: "Empty response from storage." });
      return;
    }

    const reader = upstream.body.getReader();
    const first = await reader.read();
    if (first.done || !first.value?.length) {
      res.status(502).json({ error: "Empty file from storage." });
      return;
    }
    let firstBuf = Buffer.from(first.value);
    while (firstBuf.length < 4) {
      const n = await reader.read();
      if (n.done) break;
      if (n.value?.length) firstBuf = Buffer.concat([firstBuf, Buffer.from(n.value)]);
    }
    const contentType = streamContentTypeFromFilenameAndBytes(filenameRaw || "file.bin", firstBuf);

    const baseName = (filenameRaw || "lesson")
      .replace(/[\\/]/g, " ")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .slice(0, 180) || "lesson";
    const hasExt = /\.[a-z0-9]{2,8}$/i.test(baseName);
    const fallbackExt =
      path.extname(filenameRaw || "").toLowerCase() ||
      (contentType === "application/pdf" ? ".pdf" : contentType.startsWith("image/") ? ".jpg" : ".bin");
    const withExt = hasExt ? baseName : `${baseName}${fallbackExt}`;
    const asciiFallback = withExt.replace(/[^\x20-\x7E]/g, "_");

    const disposition = wantDownload ? "attachment" : "inline";
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${asciiFallback.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"; filename*=UTF-8''${encodeURIComponent(withExt)}`
    );
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const len = upstream.headers.get("content-length");
    if (len && /^\d+$/.test(len)) {
      res.setHeader("Content-Length", len);
    }

    const pass = new PassThrough();
    pass.write(firstBuf);
    void (async () => {
      try {
        for (;;) {
          const n = await reader.read();
          if (n.done) break;
          if (n.value?.length) pass.write(Buffer.from(n.value));
        }
        pass.end();
      } catch (err) {
        pass.destroy(err instanceof Error ? err : undefined);
      }
    })();

    try {
      await pipeline(pass, res);
    } catch (err) {
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to stream document." });
      } else {
        res.destroy(err instanceof Error ? err : undefined);
      }
    }
  } catch (e) {
    console.error("streamCourseDocument:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream document." });
    }
  }
}

/** GET /api/course-content/courses/:courseId/resolve-pdf?title=... – Find a lesson PDF URL by title. */
export async function resolveCoursePdf(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { title } = req.query as { title?: string };
    if (!title) {
      res.status(400).json({ error: "Title is required." });
      return;
    }

    const cleanTitle = title.trim().toLowerCase();
    const modRows = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules).find({ courseId }).toArray();
    const lessonsC = mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons);

    let fallbackPdf: string | undefined = undefined;

    for (const mod of modRows) {
      const lessonRows = await lessonsC.find({ courseId, moduleId: mod.id }).toArray();
      for (const row of lessonRows) {
        const data = omitMongoId(row) as LessonDoc;
        const dTitle = (data.title || "").trim().toLowerCase();
        
        // Match: exact, contains, or fuzzy
        if (dTitle === cleanTitle || dTitle.includes(cleanTitle) || cleanTitle.includes(dTitle)) {
           const pdf = (data.pdfUrl || "").trim();
           if (pdf.startsWith("http")) {
             res.json({ pdfUrl: pdf });
             return;
           }
           if (pdf && !fallbackPdf) fallbackPdf = pdf;
        }
      }
    }

    if (fallbackPdf) {
      res.json({ pdfUrl: fallbackPdf });
      return;
    }

    res.status(404).json({ error: "PDF not found for this title." });
  } catch (e) {
    console.error("resolveCoursePdf:", e);
    res.status(500).json({ error: "Failed to resolve PDF." });
  }
}
