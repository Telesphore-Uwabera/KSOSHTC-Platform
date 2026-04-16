import type { Request, Response } from "express";
import type { Instructor } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "./mongo";

export type StaffSessionPayload = {
  v: 2;
  exp: number;
  role: "admin" | "instructor";
  userId: string;
};

export function getStaffSessionPayload(req: Request): StaffSessionPayload | null {
  const p = (req as any).staffSession as StaffSessionPayload | undefined;
  if (!p) return null;
  if (p.role !== "admin" && p.role !== "instructor") return null;
  if (!p.userId) return null;
  return p;
}

function instructorsCol() {
  return mongoCollection<Instructor>(MONGO_COLLECTIONS.instructors);
}

export async function getActiveInstructorByUserId(userId: string): Promise<Instructor | null> {
  const doc = await instructorsCol().findOne({ userId });
  if (!doc) return null;
  if (doc.active !== true) return null;
  return doc;
}

export function hasCourseAccess(instructor: Instructor, courseId: string): boolean {
  return Array.isArray(instructor.allowedCourseIds) && instructor.allowedCourseIds.includes(courseId as any);
}

export async function requireInstructorCourseAccess(
  req: Request,
  res: Response,
  courseId: string
): Promise<{ ok: true } | { ok: false }> {
  const staff = getStaffSessionPayload(req);
  if (!staff) return { ok: true };
  if (staff.role !== "instructor") return { ok: true };

  const inst = await getActiveInstructorByUserId(staff.userId);
  if (!inst) {
    res.status(403).json({ error: "Instructor account is inactive or missing. Contact an administrator." });
    return { ok: false };
  }
  if (!hasCourseAccess(inst, courseId)) {
    res.status(403).json({ error: "You do not have access to manage this course." });
    return { ok: false };
  }
  return { ok: true };
}

export async function requireInstructorCourseAccessMany(
  req: Request,
  res: Response,
  courseIds: string[]
): Promise<{ ok: true } | { ok: false }> {
  const staff = getStaffSessionPayload(req);
  if (!staff) return { ok: true };
  if (staff.role !== "instructor") return { ok: true };

  const inst = await getActiveInstructorByUserId(staff.userId);
  if (!inst) {
    res.status(403).json({ error: "Instructor account is inactive or missing. Contact an administrator." });
    return { ok: false };
  }
  const allowed = new Set(inst.allowedCourseIds ?? []);
  const denied = courseIds.filter((cid) => !allowed.has(cid as any));
  if (denied.length > 0) {
    res.status(403).json({ error: "You do not have access to manage one or more selected courses." });
    return { ok: false };
  }
  return { ok: true };
}

