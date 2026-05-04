import { Request, Response } from "express";
import path from "node:path";
import crypto from "node:crypto";
import type { AdminDistributedAssignmentDoc, AssignmentSubmissionDoc, CourseDoc, EnrollmentDoc, User } from "@shared/api";
import { enrollmentAllowsLearnerAccess } from "../../shared/learnerEnrollment.ts";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { v2 as cloudinary } from "cloudinary";
import { notifyAdminAssignmentSubmitted, notifyInstructorsAssignmentSubmitted, notifyLearnerAssignmentGraded, notifyLearnerAssignmentSubmitted } from "../lib/notify";
import { isAdminSessionAuthorized } from "../lib/adminSession";
import { getStaffSessionPayload, getActiveInstructorByUserId, requireInstructorCourseAccess } from "../lib/instructorAccess";
import { isAllowedUploadExtension, mimeFromExtension } from "../../shared/allowedUploads.ts";

function usersCol() {
  return mongoCollection<User>(MONGO_COLLECTIONS.users);
}
function enrollmentsCol() {
  return mongoCollection<EnrollmentDoc>(MONGO_COLLECTIONS.enrollments);
}
function coursesCol() {
  return mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
}
function assignmentSubsCol() {
  return mongoCollection<AssignmentSubmissionDoc>(MONGO_COLLECTIONS.assignment_submissions);
}
function distributedAssignmentsCol() {
  return mongoCollection<AdminDistributedAssignmentDoc>(MONGO_COLLECTIONS.admin_distributed_assignments);
}

/** POST /api/assignment-submissions – learner uploads a file for an assigned/enrolled course. */
export async function postAssignmentSubmission(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      userId?: string;
      courseId?: string;
      assignmentId?: string;
      title?: string;
      filename?: string;
      contentBase64?: string;
    };
    const { userId, courseId, assignmentId, title, filename, contentBase64 } = body;
    if (!userId || !courseId || !title?.trim() || !filename || !contentBase64) {
      res.status(400).json({ error: "userId, courseId, title, filename, and contentBase64 are required." });
      return;
    }

    const user = await usersCol().findOne({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (!user.approved) {
      res.status(403).json({ error: "Account must be approved to submit work." });
      return;
    }
    if (user.role && user.role !== "learner") {
      res.status(403).json({ error: "Only learners can submit assignments." });
      return;
    }

    const userEnrollments = await enrollmentsCol().find({ userId }).toArray();
    const hasAnyEnrollment = userEnrollments.length > 0;
    const enrolledInCourse = userEnrollments.some(
      (e) => e.courseId === courseId && enrollmentAllowsLearnerAccess(e.status)
    );
    const sectorAllows = courseId === "safety-management" || courseId === (user.sector ?? "");
    const allowed = enrolledInCourse || (!hasAnyEnrollment && sectorAllows);
    if (!allowed) {
      res.status(403).json({
        error:
          "You can only submit work for courses you are enrolled in. Ask an administrator to assign the course if needed.",
      });
      return;
    }

    const course = await coursesCol().findOne({ id: courseId });
    if (!course) {
      res.status(404).json({ error: "Course not found." });
      return;
    }

    let linkedAssignment: AdminDistributedAssignmentDoc | null = null;
    if (assignmentId && assignmentId.trim()) {
      linkedAssignment = await distributedAssignmentsCol().findOne({ id: assignmentId.trim() });
      if (!linkedAssignment) {
        res.status(400).json({ error: "Selected assignment was not found." });
        return;
      }
      if (!linkedAssignment.courseIds.includes(courseId)) {
        res.status(400).json({ error: "Selected assignment is not linked to this course." });
        return;
      }
      const existingForAssignment = await assignmentSubsCol().findOne({
        userId,
        assignmentId: linkedAssignment.id,
      });
      if (existingForAssignment) {
        res.status(409).json({
          error: "You have already submitted for this assignment. Each shared assignment allows one submission.",
        });
        return;
      }
    }

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
    const ext = path.extname(safeName).toLowerCase();
    if (!isAllowedUploadExtension(ext)) {
      res.status(400).json({
        error:
          "This file type is not allowed. Use PDF, Word, Excel, PowerPoint, images, or other supported document formats.",
      });
      return;
    }
    const buf = Buffer.from(contentBase64, "base64");
    if (buf.length > 50 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 50MB)." });
      return;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const mime = mimeFromExtension(ext);
    const publicId = `${path.parse(safeName).name}${ext}`;
    const uri = `data:${mime};base64,${contentBase64}`;
    const result = await cloudinary.uploader.upload(uri, {
      folder: `ksohtc/assignment-submissions/${userId}`,
      public_id: publicId,
      resource_type: "raw",
    });
    const pdfUrl = result.secure_url;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const resolvedTitle = (title ?? "").trim() || linkedAssignment?.title || "Assignment submission";
    const doc: AssignmentSubmissionDoc = {
      id,
      userId,
      courseId,
      ...(linkedAssignment?.id ? { assignmentId: linkedAssignment.id } : {}),
      title: resolvedTitle,
      pdfUrl,
      originalFilename: safeName,
      submittedAt: now,
      learnerName: user.name,
      learnerEmail: user.email,
      courseTitle: course.title,
      marks: null,
      maxMarks: 100,
    };
    await assignmentSubsCol().insertOne(doc as any);

    await notifyAdminAssignmentSubmitted({
      learnerName: user.name,
      learnerEmail: user.email,
      courseTitle: course.title,
      assignmentTitle: resolvedTitle,
      submissionId: id,
    });

    await notifyInstructorsAssignmentSubmitted({
      courseId: courseId as any,
      learnerName: user.name,
      learnerEmail: user.email,
      courseTitle: course.title,
      assignmentTitle: resolvedTitle,
      submissionId: id,
      creatorUserId: linkedAssignment?.createdByUserId,
    });

    await notifyLearnerAssignmentSubmitted({
      name: user.name,
      email: user.email,
      courseTitle: course.title,
      assignmentTitle: resolvedTitle,
      submissionId: id,
    });

    res.status(201).json({ submission: doc });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("postAssignmentSubmission:", msg);
    res.status(500).json({ error: "Failed to submit assignment." });
  }
}

export async function getAssignmentSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const { userId, courseId } = req.query as { userId?: string; courseId?: string };
    const filter: Record<string, unknown> = {};
    if (courseId) filter.courseId = courseId;
    if (userId) filter.userId = userId;
    const staff = getStaffSessionPayload(req);
    let instructorOwnAssignmentIds: Set<string> | null = null;
    let instructorLegacyKeys: Set<string> | null = null;
    if (staff?.role === "instructor") {
      const inst = await getActiveInstructorByUserId(staff.userId);
      if (!inst) {
        res.status(403).json({ error: "Instructor account is inactive or missing. Contact an administrator." });
        return;
      }
      const allowed = new Set(inst.allowedCourseIds ?? []);
      const ownAssignments = await distributedAssignmentsCol()
        .find({ createdByUserId: staff.userId })
        .toArray();
      if (ownAssignments.length === 0) {
        res.json({ submissions: [] });
        return;
      }
      instructorOwnAssignmentIds = new Set(ownAssignments.map((a) => a.id));
      instructorLegacyKeys = new Set(
        ownAssignments.flatMap((a) => a.courseIds.map((cid) => `${cid}::${a.title.trim().toLowerCase()}`))
      );

      if (courseId) {
        const gate = await requireInstructorCourseAccess(req, res, courseId);
        if (!gate.ok) return;
      } else {
        // Let the admin UI show all submissions as long as they belong to instructor's allowed courses.
        const allowedList = [...allowed];
        if (allowedList.length === 0) {
          res.json({ submissions: [] });
          return;
        }
        filter.courseId = { $in: allowedList };
      }
    } else if (Object.keys(filter).length === 0 && !isAdminSessionAuthorized(req)) {
      res.status(401).json({ error: "Admin session required to list all assignment submissions." });
      return;
    }
    const list = await assignmentSubsCol()
      .find(Object.keys(filter).length ? filter : {})
      .toArray();
    const scoped =
      staff?.role === "instructor" && instructorOwnAssignmentIds && instructorLegacyKeys
        ? list.filter((s) => {
            if (s.assignmentId && instructorOwnAssignmentIds!.has(s.assignmentId)) return true;
            // Backward compatibility for legacy rows without assignmentId.
            const key = `${s.courseId}::${(s.title ?? "").trim().toLowerCase()}`;
            return instructorLegacyKeys!.has(key);
          })
        : list;
    const submissions = scoped.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
    res.json({ submissions });
  } catch (e) {
    console.error("getAssignmentSubmissions:", e);
    res.status(500).json({ error: "Failed to list assignment submissions." });
  }
}

/** Extract Cloudinary public_id for learner assignment raw uploads (ksohtc/assignment-submissions/...). */
function cloudinaryPublicIdFromAssignmentPdfUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    if (!u.hostname.endsWith("res.cloudinary.com")) return null;
    const p = u.pathname;
    const marker = "/raw/upload/";
    const i = p.indexOf(marker);
    if (i < 0) return null;
    let rest = p.slice(i + marker.length);
    rest = rest.replace(/^v\d+\//, "");
    if (!rest.startsWith("ksohtc/assignment-submissions/")) return null;
    return decodeURIComponent(rest);
  } catch {
    return null;
  }
}

async function destroyAssignmentSubmissionAsset(pdfUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const publicId = cloudinaryPublicIdFromAssignmentPdfUrl(pdfUrl);
  if (!publicId) return { ok: false, error: "Stored file URL is not a removable Cloudinary assignment upload." };

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });
    if (result.result === "ok" || result.result === "not found") return { ok: true };
    return { ok: false, error: `Cloudinary: ${String(result.result)}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** DELETE /api/assignment-submissions/:id — admin OR learner (within 48h) removes DB row and file. */
export async function deleteAssignmentSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.query as { userId?: string };
    const col = assignmentSubsCol();
    const snap = await col.findOne({ id });
    if (!snap) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }

    const isAdmin = isAdminSessionAuthorized(req);
    const isOwner = userId && snap.userId === userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: "Not authorized to delete this submission." });
      return;
    }

    if (!isAdmin && isOwner) {
      const submittedAt = new Date(snap.submittedAt).getTime();
      const now = Date.now();
      const limitMs = 48 * 60 * 60 * 1000;
      if (now - submittedAt > limitMs) {
        res.status(403).json({ error: "Submissions can only be deleted within 48 hours after upload." });
        return;
      }
      if (snap.marks !== null && snap.marks !== undefined) {
        res.status(403).json({ error: "Cannot delete a submission that has already been graded." });
        return;
      }
    }

    const destroyed = await destroyAssignmentSubmissionAsset(snap.pdfUrl);
    if (destroyed.ok === false) {
      res.status(400).json({ error: destroyed.error });
      return;
    }

    const r = await col.deleteOne({ id });
    if (r.deletedCount === 0) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    res.status(204).send();
  } catch (e) {
    console.error("deleteAssignmentSubmission:", e);
    res.status(500).json({ error: "Failed to delete submission." });
  }
}

export async function patchAssignmentSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const col = assignmentSubsCol();
    const snap = await col.findOne({ id });
    if (!snap) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    const prev = snap;
    const gate = await requireInstructorCourseAccess(req, res, prev.courseId);
    if (!gate.ok) return;
    const body = req.body as { marks?: number; maxMarks?: number; feedback?: string };
    const updates: Record<string, unknown> = {};

    if (body.maxMarks !== undefined) {
      if (typeof body.maxMarks !== "number" || body.maxMarks < 1) {
        res.status(400).json({ error: "maxMarks must be a positive number." });
        return;
      }
      updates.maxMarks = body.maxMarks;
    }
    if (body.feedback !== undefined) {
      updates.feedback = String(body.feedback);
    }

    let shouldNotifyMarks = false;
    if (body.marks !== undefined) {
      if (typeof body.marks !== "number" || body.marks < 0 || !Number.isFinite(body.marks)) {
        res.status(400).json({ error: "marks must be a non-negative number." });
        return;
      }
      const maxM = (body.maxMarks ?? prev.maxMarks ?? 100) as number;
      if (body.marks > maxM) {
        res.status(400).json({ error: "marks cannot exceed maxMarks." });
        return;
      }
      updates.marks = body.marks;
      updates.gradedAt = new Date().toISOString();
      const prevMarks = prev.marks;
      shouldNotifyMarks = prevMarks === undefined || prevMarks === null || prevMarks !== body.marks;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Provide marks, maxMarks, and/or feedback to update." });
      return;
    }

    await col.updateOne({ id }, { $set: updates });
    const merged = { ...prev, ...updates } as AssignmentSubmissionDoc;

    if (shouldNotifyMarks && merged.learnerEmail && typeof merged.marks === "number") {
      const maxM = merged.maxMarks ?? 100;
      await notifyLearnerAssignmentGraded({
        name: merged.learnerName ?? "Learner",
        email: merged.learnerEmail,
        courseTitle: merged.courseTitle ?? merged.courseId,
        assignmentTitle: merged.title,
        marks: merged.marks,
        maxMarks: maxM,
        feedback: merged.feedback,
      });
    }

    res.json({ submission: merged });
  } catch (e) {
    console.error("patchAssignmentSubmission:", e);
    res.status(500).json({ error: "Failed to update submission." });
  }
}
