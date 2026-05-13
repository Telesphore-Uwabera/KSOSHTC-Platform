import { Request, Response } from "express";
import crypto from "node:crypto";
import type { CourseId, CoursePublic, Quiz } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { requireInstructorCourseAccess } from "../lib/instructorAccess";
import { getBearerToken, verifyAdminSessionToken } from "../lib/adminSession";
import { getActiveInstructorByUserId } from "../lib/instructorAccess";

/** Four courses: three sector-specific + one general safety (mining → mining + safety, construction → construction + safety, etc.). */
const COURSES: CoursePublic[] = [
  { id: "construction", title: "OSH in Construction", sector: "Construction", duration: "3 months" },
  { id: "industrial-safety", title: "OSH in Industrial Safety", sector: "Industrial", duration: "3 months" },
  { id: "mining", title: "OSH in Mining", sector: "Mining", duration: "3 months" },
  { id: "safety-management", title: "Safety Management (General)", sector: "General", duration: "3 months" },
];

const COURSES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let coursesCache: { fetchedAt: number; data: CoursePublic[] } | null = null;

async function isValidCourseId(id: string): Promise<boolean> {
  if (COURSES.some((c) => c.id === id)) return true;
  const doc = await mongoCollection<{ id: string }>(MONGO_COLLECTIONS.courses).findOne({ id });
  return !!doc;
}

/** GET /api/courses – list courses (for admin) */
export async function getCourses(_req: Request, res: Response): Promise<void> {
  try {
    const staff = verifyAdminSessionToken(getBearerToken(_req));
    if (!staff.ok && coursesCache && Date.now() - coursesCache.fetchedAt < COURSES_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
      res.json({ courses: coursesCache.data });
      return;
    }

    const col = mongoCollection<CoursePublic & { slug?: CourseId; description?: string }>(MONGO_COLLECTIONS.courses);
    const raw = await col.find({}).sort({ order: 1 }).toArray();
    const dbCourses: CoursePublic[] = raw.map((d) => ({
      id: (d.slug ?? d.id) as CourseId,
      title: d.title,
      sector: d.sector,
      duration: d.duration || "3 months",
    }));

    if (staff.ok && staff.payload.role === "instructor") {
      const inst = await getActiveInstructorByUserId(staff.payload.userId);
      const allowed = new Set(inst?.allowedCourseIds ?? []);
      res.json({ courses: dbCourses.filter((c) => allowed.has(c.id)) });
      return;
    }

    const finalCourses = dbCourses.length > 0 ? dbCourses : COURSES;
    
    if (!staff.ok) {
      coursesCache = { fetchedAt: Date.now(), data: finalCourses };
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
    }
    
    res.json({ courses: finalCourses });
  } catch (e) {
    res.json({ courses: COURSES });
  }
}

/** GET /api/courses/:courseId/quiz – get quiz for a course */
export async function getCourseQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { courseId: courseIdParam } = req.params;
    if (!(await isValidCourseId(courseIdParam))) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const courseId = courseIdParam as CourseId;
    const doc = await mongoCollection<Quiz>(MONGO_COLLECTIONS.quizzes).findOne({ courseId });
    if (!doc) {
      res.status(204).send();
      return;
    }
    const { _id, ...quiz } = doc as Quiz & { _id?: unknown };
    res.json(quiz);
  } catch (e) {
    console.error("Get quiz error:", e);
    res.status(500).json({ error: "Failed to load quiz." });
  }
}

/** PUT /api/courses/:courseId/quiz – create or update quiz (admin) */
export async function putCourseQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { courseId: courseIdParam } = req.params;
    const courseGate = await requireInstructorCourseAccess(req, res, courseIdParam);
    if (!courseGate.ok) return;
    if (!(await isValidCourseId(courseIdParam))) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const courseId = courseIdParam as CourseId;
    const body = req.body as {
      title?: string;
      description?: string;
      questions?: Array<{ id?: string; text: string; options: string[]; correctIndex: number }>;
      passThreshold?: number;
    };
    const now = new Date().toISOString();
    const col = mongoCollection<Quiz>(MONGO_COLLECTIONS.quizzes);
    const existing = await col.findOne({ courseId });

    const questions = (body.questions ?? []).map((q) => ({
      id: q.id ?? crypto.randomUUID(),
      text: String(q.text ?? "").trim(),
      options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [],
      correctIndex: Math.max(0, Math.min(Number(q.correctIndex) || 0, (q.options?.length ?? 1) - 1)),
    }));

    const quizPayload: Quiz = {
      id: existing?.id ?? crypto.randomUUID(),
      courseId,
      title: String(body.title ?? "Course assessment").trim() || "Course assessment",
      description: typeof body.description === "string" ? body.description.trim() || undefined : undefined,
      questions,
      passThreshold: Math.max(0, Math.min(100, Number(body.passThreshold) ?? 70)),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await col.replaceOne({ courseId }, quizPayload as any, { upsert: true });
    res.json(quizPayload);
  } catch (e) {
    console.error("Put quiz error:", e);
    res.status(500).json({ error: "Failed to save quiz." });
  }
}

/** DELETE /api/courses/:courseId/quiz – remove quiz (admin) */
export async function deleteCourseQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { courseId: courseIdParam } = req.params;
    const courseGate = await requireInstructorCourseAccess(req, res, courseIdParam);
    if (!courseGate.ok) return;
    if (!(await isValidCourseId(courseIdParam))) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const courseId = courseIdParam as CourseId;
    const col = mongoCollection<Quiz>(MONGO_COLLECTIONS.quizzes);
    const r = await col.deleteOne({ courseId });
    if (r.deletedCount === 0) {
      res.status(404).json({ error: "No quiz set for this course." });
      return;
    }
    res.status(204).send();
  } catch (e) {
    console.error("Delete quiz error:", e);
    res.status(500).json({ error: "Failed to delete quiz." });
  }
}
