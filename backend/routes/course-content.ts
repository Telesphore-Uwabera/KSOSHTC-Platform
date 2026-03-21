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
} from "@shared/api";
import {
  coursesRef,
  courseDoc,
  modulesRef,
  moduleDoc,
  lessonsRef,
  lessonDoc,
  assessmentsRef,
  assessmentDoc,
  isValidCourseSlug,
} from "../lib/course-firestore";
import { submissionsCollection, progressCollection } from "../lib/firestore";
import type { SubmissionDoc, ProgressDoc } from "@shared/api";
import { v2 as cloudinary } from "cloudinary";

/** All courses display duration as 3 months. */
const DISPLAY_DURATION = "3 months";

/** POST /api/course-content/courses/:courseId/upload-pdf – admin upload course PDF only. Body: { filename: string, contentBase64: string } */
export async function uploadCoursePdf(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      res.status(400).json({ error: "courseId is required." });
      return;
    }
    const body = req.body as { filename?: string; contentBase64?: string };
    const filename = typeof body.filename === "string" ? body.filename.trim() : "";
    const contentBase64 = body.contentBase64;
    if (!filename || !contentBase64) {
      res.status(400).json({ error: "filename and contentBase64 are required." });
      return;
    }
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
    const ext = path.extname(safeName).toLowerCase();
    const allowed = [".pdf"];
    if (!allowed.includes(ext)) {
      res.status(400).json({ error: `Only PDF course materials are allowed (got ${ext}).` });
      return;
    }
    const buf = Buffer.from(contentBase64, "base64");
    if (buf.length > 50 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 50MB)." });
      return;
    }
    
    const uri = `data:application/pdf;base64,${contentBase64}`;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    // Raw uploads: include .pdf in public_id so delivery URLs and the console show a real extension/format.
    const publicId = `${path.parse(safeName).name}.pdf`;
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

    const ref = courseDoc(courseId);
    const snap = await ref.get();
    if (snap.exists) {
      const now = new Date().toISOString();
      const current = snap.data() as Omit<CourseDoc, "id">;
      await ref.set({ ...current, coverImageUrl, updatedAt: now });
    }

    res.status(201).json({ ok: true, coverImageUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("uploadCourseCover:", msg);
    res.status(500).json({ error: "Failed to upload cover image.", detail: msg });
  }
}

/** GET /api/course-content/courses – list all courses from Firestore */
export async function listCourses(_req: Request, res: Response): Promise<void> {
  try {
    const snap = await coursesRef().orderBy("order", "asc").get();
    const courses: CourseDoc[] = snap.docs.map((d) => {
      const doc = { id: d.id, ...d.data() } as CourseDoc;
      return { ...doc, duration: DISPLAY_DURATION };
    });
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
    const doc = await courseDoc(courseId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    res.json({ id: doc.id, ...doc.data() });
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
    const ref = courseDoc(slug);
    const existing = await ref.get();
    if (existing.exists) {
      res.status(409).json({ error: "Course with this slug already exists." });
      return;
    }
    const data: Omit<CourseDoc, "id"> = {
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
    await ref.set(data);
    res.status(201).json({ id: slug, ...data });
  } catch (e) {
    console.error("createCourse:", e);
    res.status(500).json({ error: "Failed to create course." });
  }
}

/** PUT /api/course-content/courses/:courseId – update course (admin) */
export async function updateCourse(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const body = req.body as Partial<Pick<CourseDoc, "title" | "description" | "sector" | "duration" | "coverImageUrl" | "published" | "order">>;
    const ref = courseDoc(courseId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = snap.data() as Omit<CourseDoc, "id">;
    const updated = {
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
    await ref.set(updated);
    res.json({ id: courseId, ...updated });
  } catch (e) {
    console.error("updateCourse:", e);
    res.status(500).json({ error: "Failed to update course." });
  }
}

/** Return total lesson + assessment count for a course (for completion %) */
export async function getCourseTotalSteps(courseId: string): Promise<{ totalLessons: number; totalAssessments: number }> {
  const modsSnap = await modulesRef(courseId).orderBy("order", "asc").get();
  let totalLessons = 0;
  let totalAssessments = 0;
  for (const modDoc of modsSnap.docs) {
    const [lessonsSnap, assessmentsSnap] = await Promise.all([
      lessonsRef(courseId, modDoc.id).get(),
      assessmentsRef(courseId, modDoc.id).get(),
    ]);
    totalLessons += lessonsSnap.size;
    totalAssessments += assessmentsSnap.size;
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
    const snap = await modulesRef(courseId).orderBy("order", "asc").get();
    const modules: ModuleDoc[] = snap.docs.map((d) => ({
      id: d.id,
      courseId,
      ...d.data(),
    } as ModuleDoc));
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
    const body = req.body as { title: string; order?: number };
    const courseSnap = await courseDoc(courseId).get();
    if (!courseSnap.exists) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const order = Number(body.order) ?? 0;
    const data: Omit<ModuleDoc, "id"> = {
      courseId,
      title: String(body.title ?? "Untitled module").trim(),
      order,
      createdAt: now,
      updatedAt: now,
    };
    await moduleDoc(courseId, id).set(data);
    res.status(201).json({ id, ...data });
  } catch (e) {
    console.error("createModule:", e);
    res.status(500).json({ error: "Failed to create module." });
  }
}

/** PUT /api/course-content/courses/:courseId/modules/:moduleId – update module */
export async function updateModule(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const body = req.body as { title?: string; order?: number };
    const ref = moduleDoc(courseId, moduleId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = snap.data() as Omit<ModuleDoc, "id">;
    const updated = {
      ...current,
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.order !== undefined && { order: Number(body.order) }),
      updatedAt: now,
    };
    await ref.set(updated);
    res.json({ id: moduleId, ...updated });
  } catch (e) {
    console.error("updateModule:", e);
    res.status(500).json({ error: "Failed to update module." });
  }
}

/** DELETE /api/course-content/courses/:courseId/modules/:moduleId */
export async function deleteModule(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const ref = moduleDoc(courseId, moduleId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    const lessonsSnap = await lessonsRef(courseId, moduleId).get();
    for (const d of lessonsSnap.docs) await d.ref.delete();
    const assessmentsSnap = await assessmentsRef(courseId, moduleId).get();
    for (const d of assessmentsSnap.docs) await d.ref.delete();
    await ref.delete();
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
    const snap = await lessonsRef(courseId, moduleId).orderBy("order", "asc").get();
    const lessons: LessonDoc[] = snap.docs.map((d) => ({
      id: d.id,
      courseId,
      moduleId,
      ...d.data(),
    } as LessonDoc));
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
    const body = req.body as { title: string; order?: number; youtubeUrl?: string; pdfUrl?: string; contentHtml?: string };
    const moduleSnap = await moduleDoc(courseId, moduleId).get();
    if (!moduleSnap.exists) {
      res.status(404).json({ error: "Module not found." });
      return;
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const rawData = {
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
    // Strip undefined fields — Firestore rejects them when ignoreUndefinedProperties is not set
    const data = Object.fromEntries(Object.entries(rawData).filter(([, v]) => v !== undefined)) as Omit<LessonDoc, "id">;
    await lessonDoc(courseId, moduleId, id).set(data);
    res.status(201).json({ id, ...data });
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
    const body = req.body as { title?: string; order?: number; youtubeUrl?: string; pdfUrl?: string; contentHtml?: string; published?: boolean };
    const ref = lessonDoc(courseId, moduleId, lessonId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = snap.data() as Omit<LessonDoc, "id">;
    const updated = {
      ...current,
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.order !== undefined && { order: Number(body.order) }),
      ...(body.youtubeUrl !== undefined && { youtubeUrl: body.youtubeUrl?.trim() || undefined }),
      ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl?.trim() || undefined }),
      ...(body.contentHtml !== undefined && { contentHtml: body.contentHtml }),
      ...(body.published !== undefined && { published: Boolean(body.published) }),
      updatedAt: now,
    };
    await ref.set(updated);
    res.json({ id: lessonId, ...updated });
  } catch (e) {
    console.error("updateLesson:", e);
    res.status(500).json({ error: "Failed to update lesson." });
  }
}

/** DELETE /api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId */
export async function deleteLesson(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const ref = lessonDoc(courseId, moduleId, lessonId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    await ref.delete();
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
    const snap = await assessmentsRef(courseId, moduleId).get();
    const assessments: AssessmentDoc[] = snap.docs
      .map((d) => ({ id: d.id, courseId, moduleId, ...d.data() } as AssessmentDoc))
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
    const [lessonsSnap, assessmentsSnap] = await Promise.all([
      lessonsRef(courseId, moduleId).orderBy("order", "asc").get(),
      assessmentsRef(courseId, moduleId).get(),
    ]);
    const lessons: LessonDoc[] = lessonsSnap.docs.map((d) => ({ id: d.id, courseId, moduleId, ...d.data() } as LessonDoc));
    const assessments: AssessmentDoc[] = assessmentsSnap.docs
      .map((d) => ({ id: d.id, courseId, moduleId, ...d.data() } as AssessmentDoc))
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
    const doc = await assessmentDoc(courseId, moduleId, assessmentId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    res.json({ id: doc.id, courseId, moduleId, ...doc.data() });
  } catch (e) {
    console.error("getAssessment:", e);
    res.status(500).json({ error: "Failed to get assessment." });
  }
}

/** POST /api/course-content/courses/:courseId/modules/:moduleId/assessments – add assessment (break quiz) */
export async function createAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;
    const body = req.body as {
      title: string;
      description?: string;
      questions?: Array<{ text: string; options: string[]; correctIndex: number }>;
      passThreshold?: number;
      order?: number;
      afterLessonId?: string;
    };
    const moduleSnap = await moduleDoc(courseId, moduleId).get();
    if (!moduleSnap.exists) {
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
    const data: Omit<AssessmentDoc, "id"> = {
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
    const ref = assessmentDoc(courseId, moduleId, id);
    await ref.set({ id, ...data });
    res.status(201).json({ id, ...data });
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
    const body = req.body as {
      title?: string;
      description?: string;
      questions?: Array<{ id?: string; text: string; options: string[]; correctIndex: number }>;
      passThreshold?: number;
      published?: boolean;
      order?: number;
      afterLessonId?: string;
    };
    const ref = assessmentDoc(courseId, moduleId, assessmentId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    const now = new Date().toISOString();
    const current = snap.data() as Omit<AssessmentDoc, "id">;
    const questions: QuizQuestion[] =
      body.questions !== undefined
        ? body.questions.map((q) => ({
            id: q.id ?? crypto.randomUUID(),
            text: String(q.text ?? "").trim(),
            options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [],
            correctIndex: Math.max(0, Math.min(Number(q.correctIndex) ?? 0, (q.options?.length ?? 1) - 1)),
          }))
        : current.questions;
    const updated = {
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
    await ref.set(updated);
    res.json({ id: assessmentId, ...updated });
  } catch (e) {
    console.error("updateAssessment:", e);
    res.status(500).json({ error: "Failed to update assessment." });
  }
}

/** DELETE /api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId */
export async function deleteAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, moduleId, assessmentId } = req.params;
    const ref = assessmentDoc(courseId, moduleId, assessmentId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    await ref.delete();
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
    const assessRef = assessmentDoc(courseId, moduleId, assessmentId);
    const assessSnap = await assessRef.get();
    if (!assessSnap.exists) {
      res.status(404).json({ error: "Assessment not found." });
      return;
    }
    const assessment = { id: assessSnap.id, ...assessSnap.data() } as AssessmentDoc;
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
    await submissionsCollection().doc(submissionId).set(submission);

    const progressId = `${userId}_${courseId}`;
    const progressRef = progressCollection().doc(progressId);
    const progressSnap = await progressRef.get();
    const completedAssessmentIds = progressSnap.exists
      ? [...((progressSnap.data() as ProgressDoc).completedAssessmentIds ?? [])]
      : [];
    if (passed && !completedAssessmentIds.includes(assessmentId)) {
      completedAssessmentIds.push(assessmentId);
      const progressData: ProgressDoc = progressSnap.exists
        ? { ...(progressSnap.data() as ProgressDoc), completedAssessmentIds, updatedAt: now }
        : { id: progressId, userId, courseId, completedLessonIds: [], completedAssessmentIds, updatedAt: now };
      await progressRef.set(progressData);
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
    let query: FirebaseFirestore.Query = submissionsCollection();
    if (courseId) {
      query = query.where("courseId", "==", courseId);
    }
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    const snap = await query.get();
    const submissions = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as SubmissionDoc))
      .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
    res.json({ submissions });
  } catch (e) {
    console.error("getSubmissions:", e);
    res.status(500).json({ error: "Failed to list submissions." });
  }
}

/**
 * GET /api/course-content/stream-document?url=&filename=&download=1
 * Streams Cloudinary course PDFs with correct headers. Verifies %PDF magic — non-PDF assets are rejected.
 * Use download=1 for Content-Disposition: attachment (explicit download). Default is inline for in-page viewing.
 */
export async function streamCourseDocument(req: Request, res: Response): Promise<void> {
  try {
    const urlStr = typeof req.query.url === "string" ? req.query.url.trim() : "";
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
    if (!p.includes("/ksohtc/courses/")) {
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
    const isPdf =
      firstBuf.length >= 4 &&
      firstBuf[0] === 0x25 &&
      firstBuf[1] === 0x50 &&
      firstBuf[2] === 0x44 &&
      firstBuf[3] === 0x46;
    if (!isPdf) {
      await reader.cancel().catch(() => {});
      res.status(415).json({ error: "Course materials must be PDF files only." });
      return;
    }

    const baseName = (filenameRaw || "lesson")
      .replace(/[\\/]/g, " ")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .slice(0, 180) || "lesson";
    const withExt = /\.[a-z0-9]{2,8}$/i.test(baseName) ? baseName : `${baseName}.pdf`;
    const asciiFallback = withExt.replace(/[^\x20-\x7E]/g, "_");

    const disposition = wantDownload ? "attachment" : "inline";
    res.setHeader("Content-Type", "application/pdf");
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
    const modulesSnap = await modulesRef(courseId).get();
    
    let fallbackPdf: string | undefined = undefined;

    for (const modDoc of modulesSnap.docs) {
      const lessonsSnap = await lessonsRef(courseId, modDoc.id).get();
      for (const d of lessonsSnap.docs) {
        const data = d.data();
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
