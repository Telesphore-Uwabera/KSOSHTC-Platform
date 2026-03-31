import { Request, Response } from "express";
import crypto from "node:crypto";
import type { CourseDoc, EnrollmentDoc, EnrollmentStatus, User } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { notifyLearnerCourseAccess } from "../lib/notify";
import { getCourseTotalSteps } from "./course-content";
import { isAdminSessionAuthorized } from "../lib/adminSession";

function usersCol() {
  return mongoCollection<User>(MONGO_COLLECTIONS.users);
}
function coursesCol() {
  return mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
}

function enrollmentsCol() {
  return mongoCollection<EnrollmentDoc>(MONGO_COLLECTIONS.enrollments);
}

/** POST /api/enrollments – enroll a user in a course (creates enrollment if not exists) */
export async function postEnrollment(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { userId: string; courseId: string };
    const { userId, courseId } = body;
    if (!userId || !courseId) {
      res.status(400).json({ error: "userId and courseId are required." });
      return;
    }
    const col = enrollmentsCol();
    const existing = await col.findOne({ userId, courseId });
    if (existing) {
      res.status(200).json({ enrollment: existing });
      return;
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const data: EnrollmentDoc = {
      id,
      userId,
      courseId,
      enrolledAt: now,
      status: "active",
    };
    await col.insertOne(data as any);
    const [learner, course] = await Promise.all([
      usersCol().findOne({ id: userId }),
      coursesCol().findOne({ id: courseId }),
    ]);
    const courseTitle = course?.title ?? courseId;
    if (learner?.email && learner.role !== "admin") {
      notifyLearnerCourseAccess({
        name: learner.name,
        email: learner.email,
        courseTitle,
        kind: "enrolled",
      }).catch((err) => console.error("[ENROLL] Notify learner failed:", err));
    }
    res.status(201).json({ enrollment: data });
  } catch (e) {
    console.error("postEnrollment:", e);
    res.status(500).json({ error: "Failed to enroll." });
  }
}

function progressDocId(userId: string, courseId: string): string {
  return [userId, courseId].join("_");
}

export type EnrollmentWithPercent = EnrollmentDoc & { completionPercent: number };

export async function getEnrollmentsForUser(userId: string): Promise<EnrollmentWithPercent[]> {
  const col = enrollmentsCol();
  const list = await col.find({ userId }).toArray();
  const withPercent = await Promise.all(
    list.map(async (en) => {
      const [progressDoc, steps] = await Promise.all([
        mongoCollection(MONGO_COLLECTIONS.progress).findOne({ id: progressDocId(userId, en.courseId) }),
        getCourseTotalSteps(en.courseId),
      ]);
      const totalSteps = steps.totalLessons + steps.totalAssessments;
      const completed =
        (progressDoc?.completedLessonIds?.length ?? 0) + (progressDoc?.completedAssessmentIds?.length ?? 0);
      const completionPercent = totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;
      return { ...en, completionPercent };
    })
  );
  return withPercent;
}

export async function getEnrollments(req: Request, res: Response): Promise<void> {
  try {
    const { userId, courseId } = req.query as { userId?: string; courseId?: string };
    const col = enrollmentsCol();
    if (userId) {
      const withPercent = await getEnrollmentsForUser(userId);
      res.json({ enrollments: withPercent });
      return;
    }
    if (courseId) {
      if (!isAdminSessionAuthorized(req)) {
        res.status(401).json({ error: "Admin session required to list enrollments by course." });
        return;
      }
      const list = await col.find({ courseId }).toArray();
      res.json({ enrollments: list });
      return;
    }
    res.status(400).json({ error: "Provide userId or courseId query." });
  } catch (e) {
    console.error("getEnrollments:", e);
    res.status(500).json({ error: "Failed to list enrollments." });
  }
}

export async function patchEnrollment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as { status?: EnrollmentStatus };
    const col = enrollmentsCol();
    const snap = await col.findOne({ id });
    if (!snap) {
      res.status(404).json({ error: "Enrollment not found." });
      return;
    }
    const wasNotApproved = snap.status === "not_approved";
    if (body.status !== undefined) {
      const allowed: EnrollmentStatus[] = ["not_approved", "active", "completed"];
      if (!allowed.includes(body.status)) {
        res.status(400).json({ error: "Invalid status." });
        return;
      }
      await col.updateOne({ id }, { $set: { status: body.status } });
    }
    const updated = await col.findOne({ id });
    if (
      updated &&
      wasNotApproved &&
      body.status === "active" &&
      updated.userId &&
      updated.courseId
    ) {
      const [learner, course] = await Promise.all([
        usersCol().findOne({ id: updated.userId }),
        coursesCol().findOne({ id: updated.courseId }),
      ]);
      const courseTitle = course?.title ?? updated.courseId;
      if (learner?.email && learner.role !== "admin") {
        notifyLearnerCourseAccess({
          name: learner.name,
          email: learner.email,
          courseTitle,
          kind: "activated",
        }).catch((err) => console.error("[ENROLL] Notify learner (activated) failed:", err));
      }
    }
    res.json({ enrollment: updated });
  } catch (e) {
    console.error("patchEnrollment:", e);
    res.status(500).json({ error: "Failed to update enrollment." });
  }
}
