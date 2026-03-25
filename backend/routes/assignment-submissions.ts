import { Request, Response } from "express";
import path from "node:path";
import crypto from "node:crypto";
import type { AssignmentSubmissionDoc, CourseDoc, EnrollmentDoc, User } from "@shared/api";
import { enrollmentAllowsLearnerAccess } from "@shared/learnerEnrollment";
import { courseDoc } from "../lib/course-firestore";
import {
  assignmentSubmissionsCollection,
  enrollmentsCollection,
  usersCollection,
} from "../lib/firestore";
import { v2 as cloudinary } from "cloudinary";
import { notifyAdminAssignmentSubmitted, notifyLearnerAssignmentGraded } from "../lib/notify";

/** POST /api/assignment-submissions – learner uploads a PDF for an assigned/enrolled course. */
export async function postAssignmentSubmission(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      userId?: string;
      courseId?: string;
      title?: string;
      filename?: string;
      contentBase64?: string;
    };
    const { userId, courseId, title, filename, contentBase64 } = body;
    if (!userId || !courseId || !title?.trim() || !filename || !contentBase64) {
      res.status(400).json({ error: "userId, courseId, title, filename, and contentBase64 are required." });
      return;
    }

    const userSnap = await usersCollection().doc(userId).get();
    if (!userSnap.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const user = userSnap.data() as User;
    if (!user.approved) {
      res.status(403).json({ error: "Account must be approved to submit work." });
      return;
    }
    if (user.role === "admin") {
      res.status(403).json({ error: "Only learners can submit assignment PDFs." });
      return;
    }

    const userEnrollments = await enrollmentsCollection().where("userId", "==", userId).get();
    const hasAnyEnrollment = !userEnrollments.empty;
    const enrolledInCourse = userEnrollments.docs.some((d) => {
      const e = d.data() as EnrollmentDoc;
      return e.courseId === courseId && enrollmentAllowsLearnerAccess(e.status);
    });
    const sectorAllows =
      courseId === "safety-management" || courseId === (user.sector ?? "");
    const allowed = enrolledInCourse || (!hasAnyEnrollment && sectorAllows);
    if (!allowed) {
      res.status(403).json({
        error:
          "You can only submit work for courses you are enrolled in. Ask an administrator to assign the course if needed.",
      });
      return;
    }

    const courseSnap = await courseDoc(courseId).get();
    if (!courseSnap.exists) {
      res.status(404).json({ error: "Course not found." });
      return;
    }
    const course = { id: courseSnap.id, ...courseSnap.data() } as CourseDoc;

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
    const ext = path.extname(safeName).toLowerCase();
    if (ext !== ".pdf") {
      res.status(400).json({ error: "Only PDF files are allowed." });
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
    const publicId = `${path.parse(safeName).name}.pdf`;
    const uri = `data:application/pdf;base64,${contentBase64}`;
    const result = await cloudinary.uploader.upload(uri, {
      folder: `ksohtc/assignment-submissions/${userId}`,
      public_id: publicId,
      resource_type: "raw",
    });
    const pdfUrl = result.secure_url;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const doc: AssignmentSubmissionDoc = {
      id,
      userId,
      courseId,
      title: title.trim(),
      pdfUrl,
      originalFilename: safeName,
      submittedAt: now,
      learnerName: user.name,
      learnerEmail: user.email,
      courseTitle: course.title,
      marks: null,
      maxMarks: 100,
    };
    await assignmentSubmissionsCollection().doc(id).set(doc);

    await notifyAdminAssignmentSubmitted({
      learnerName: user.name,
      learnerEmail: user.email,
      courseTitle: course.title,
      assignmentTitle: title.trim(),
      submissionId: id,
    });

    res.status(201).json({ submission: doc });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("postAssignmentSubmission:", msg);
    res.status(500).json({ error: "Failed to submit assignment." });
  }
}

/** GET /api/assignment-submissions?userId=&courseId= – list (optional filters; omit both for all — admin). */
export async function getAssignmentSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const { userId, courseId } = req.query as { userId?: string; courseId?: string };
    let query: FirebaseFirestore.Query = assignmentSubmissionsCollection();
    if (courseId) {
      query = query.where("courseId", "==", courseId);
    }
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    const snap = await query.get();
    const submissions = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AssignmentSubmissionDoc))
      .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
    res.json({ submissions });
  } catch (e) {
    console.error("getAssignmentSubmissions:", e);
    res.status(500).json({ error: "Failed to list assignment submissions." });
  }
}

/** PATCH /api/assignment-submissions/:id – set marks / feedback (admin); emails learner when marks change. */
export async function patchAssignmentSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ref = assignmentSubmissionsCollection().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    const prev = { id: snap.id, ...snap.data() } as AssignmentSubmissionDoc;
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
      shouldNotifyMarks =
        prevMarks === undefined || prevMarks === null || prevMarks !== body.marks;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Provide marks, maxMarks, and/or feedback to update." });
      return;
    }

    await ref.update(updates);
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
