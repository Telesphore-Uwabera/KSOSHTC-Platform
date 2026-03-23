import { Request, Response } from "express";
import crypto from "node:crypto";
import type { CourseId, CoursePublic, Quiz } from "@shared/api";
import { quizzesCollection } from "../lib/firestore";

/** Four courses: three sector-specific + one general safety (mining → mining + safety, construction → construction + safety, etc.). */
const COURSES: CoursePublic[] = [
  { id: "construction", title: "OSH in Construction", sector: "Construction", duration: "3 months" },
  { id: "industrial-safety", title: "OSH in Industrial Safety", sector: "Industrial", duration: "3 months" },
  { id: "mining", title: "OSH in Mining", sector: "Mining", duration: "3 months" },
  { id: "safety-management", title: "Safety Management (General)", sector: "General", duration: "3 months" },
];

/** Check if a courseId is valid by checking the COURSES array OR Firestore. */
async function isValidCourseId(id: string): Promise<boolean> {
  if (COURSES.some((c) => c.id === id)) return true;
  // Fallback: check Firestore if not in hardcoded list
  try {
    const { coursesCollection } = await import("../lib/firestore");
    const doc = await coursesCollection().doc(id).get();
    return doc.exists;
  } catch (e) {
    return false;
  }
}

/** GET /api/courses – list courses (for admin) */
export async function getCourses(_req: Request, res: Response): Promise<void> {
  try {
    const { coursesCollection } = await import("../lib/firestore");
    const snap = await coursesCollection().get();
    const dbCourses = snap.docs.map(d => ({ id: d.id, ...d.data() } as CoursePublic));
    // Merge or prioritize? For now, if DB has them, use them.
    if (dbCourses.length > 0) {
      res.json({ courses: dbCourses });
    } else {
      res.json({ courses: COURSES });
    }
  } catch (e) {
    res.json({ courses: COURSES });
  }
}

/** GET /api/courses/:courseId/quiz – get quiz for a course */
export async function getCourseQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    if (!(await isValidCourseId(courseId))) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const doc = await quizzesCollection().doc(courseId).get();
    if (!doc.exists) {
      // Return 204 No Content for missing quiz; front-end handles this gracefully.
      res.status(204).send();
      return;
    }
    res.json(doc.data());
  } catch (e) {
    console.error("Get quiz error:", e);
    res.status(500).json({ error: "Failed to load quiz." });
  }
}

/** PUT /api/courses/:courseId/quiz – create or update quiz (admin) */
export async function putCourseQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    if (!(await isValidCourseId(courseId))) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const body = req.body as {
      title?: string;
      description?: string;
      questions?: Array<{ id?: string; text: string; options: string[]; correctIndex: number }>;
      passThreshold?: number;
    };
    const now = new Date().toISOString();
    const docRef = quizzesCollection().doc(courseId);
    const existing = await docRef.get();

    const questions = (body.questions ?? []).map((q) => ({
      id: q.id ?? crypto.randomUUID(),
      text: String(q.text ?? "").trim(),
      options: Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [],
      correctIndex: Math.max(0, Math.min(Number(q.correctIndex) || 0, (q.options?.length ?? 1) - 1)),
    }));

    const quizPayload: Quiz = {
      id: existing.exists ? (existing.data() as Quiz).id : crypto.randomUUID(),
      courseId: courseId as CourseId,
      title: String(body.title ?? "Course assessment").trim() || "Course assessment",
      description: typeof body.description === "string" ? body.description.trim() || undefined : undefined,
      questions,
      passThreshold: Math.max(0, Math.min(100, Number(body.passThreshold) ?? 70)),
      createdAt: existing.exists ? (existing.data() as Quiz).createdAt : now,
      updatedAt: now,
    };

    await docRef.set(quizPayload);
    res.json(quizPayload);
  } catch (e) {
    console.error("Put quiz error:", e);
    res.status(500).json({ error: "Failed to save quiz." });
  }
}

/** DELETE /api/courses/:courseId/quiz – remove quiz (admin) */
export async function deleteCourseQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    if (!(await isValidCourseId(courseId))) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const docRef = quizzesCollection().doc(courseId);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "No quiz set for this course." });
      return;
    }
    await docRef.delete();
    res.status(204).send();
  } catch (e) {
    console.error("Delete quiz error:", e);
    res.status(500).json({ error: "Failed to delete quiz." });
  }
}
