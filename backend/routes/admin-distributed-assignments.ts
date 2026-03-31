import { Request, Response } from "express";
import path from "node:path";
import crypto from "node:crypto";
import type { AdminDistributedAssignmentDoc, CourseDoc, EnrollmentDoc, User } from "@shared/api";
import { allowedCourseIdsForLearner } from "../../shared/learnerAllowedCourses.ts";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { v2 as cloudinary } from "cloudinary";
import { notifyLearnerAdminDistributedPdf } from "../lib/notify";

function col() {
  return mongoCollection<AdminDistributedAssignmentDoc>(MONGO_COLLECTIONS.admin_distributed_assignments);
}
function usersCol() {
  return mongoCollection<User>(MONGO_COLLECTIONS.users);
}
function coursesCol() {
  return mongoCollection<CourseDoc>(MONGO_COLLECTIONS.courses);
}
function enrollmentsCol() {
  return mongoCollection<EnrollmentDoc>(MONGO_COLLECTIONS.enrollments);
}

function groupEnrollmentsByUser(rows: EnrollmentDoc[]): Map<string, EnrollmentDoc[]> {
  const m = new Map<string, EnrollmentDoc[]>();
  for (const e of rows) {
    const list = m.get(e.userId) ?? [];
    list.push(e);
    m.set(e.userId, list);
  }
  return m;
}

/** POST /api/admin-distributed-assignments — admin uploads PDF + selects target courses; notifies matching learners. */
export async function postAdminDistributedAssignment(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      title?: string;
      description?: string;
      filename?: string;
      contentBase64?: string;
      courseIds?: string[];
    };
    const { title, description, filename, contentBase64, courseIds } = body;
    if (!title?.trim() || !filename || !contentBase64) {
      res.status(400).json({ error: "title, filename, and contentBase64 are required." });
      return;
    }
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      res.status(400).json({ error: "Select at least one target course." });
      return;
    }

    const courses = await coursesCol()
      .find({ published: { $ne: false } })
      .toArray();
    const validIds = new Set(courses.map((c) => c.id));
    const targetCourseIds = [...new Set(courseIds.map((id) => String(id).trim()).filter(Boolean))].filter((id) =>
      validIds.has(id)
    );
    if (targetCourseIds.length === 0) {
      res.status(400).json({ error: "No valid published courses in selection." });
      return;
    }

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
    if (path.extname(safeName).toLowerCase() !== ".pdf") {
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
    const id = crypto.randomUUID();
    const publicId = `${path.parse(safeName).name}.pdf`;
    const uri = `data:application/pdf;base64,${contentBase64}`;
    const result = await cloudinary.uploader.upload(uri, {
      folder: `ksohtc/admin-assignments/${id}`,
      public_id: publicId,
      resource_type: "raw",
    });
    const pdfUrl = result.secure_url;

    const now = new Date().toISOString();
    const doc: AdminDistributedAssignmentDoc = {
      id,
      title: title.trim(),
      description: description?.trim() || undefined,
      pdfUrl,
      originalFilename: safeName,
      courseIds: targetCourseIds,
      createdAt: now,
    };
    await col().insertOne(doc as any);

    const publishedCourseIds = courses.map((c) => c.id);
    const courseTitleById = Object.fromEntries(courses.map((c) => [c.id, c.title]));
    const labels = targetCourseIds.map((cid) => courseTitleById[cid] ?? cid).join(", ");

    const allEnrollments = await enrollmentsCol().find({}).toArray();
    const enrollByUser = groupEnrollmentsByUser(allEnrollments);

    const learners = await usersCol().find({ approved: true, role: { $ne: "admin" } }).toArray();

    const targetSet = new Set(targetCourseIds);
    let learnersNotified = 0;
    for (const user of learners) {
      if (!user.email) continue;
      const enr = enrollByUser.get(user.id) ?? [];
      const allowed = allowedCourseIdsForLearner(user, enr, publishedCourseIds);
      const match = [...targetSet].some((cid) => allowed.has(cid));
      if (!match) continue;
      learnersNotified += 1;
      notifyLearnerAdminDistributedPdf({
        name: user.name,
        email: user.email,
        title: doc.title,
        description: doc.description,
        courseLabels: labels,
      }).catch((err) => console.error("[ADMIN_HANDOUT] Email failed:", user.email, err));
    }

    res.status(201).json({ assignment: doc, learnersNotified });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("postAdminDistributedAssignment:", msg);
    res.status(500).json({ error: "Failed to publish handout." });
  }
}

/** GET /api/admin-distributed-assignments — list all (newest first), for admin UI. */
export async function listAdminDistributedAssignments(_req: Request, res: Response): Promise<void> {
  try {
    const list = await col()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ assignments: list });
  } catch (e) {
    console.error("listAdminDistributedAssignments:", e);
    res.status(500).json({ error: "Failed to list handouts." });
  }
}

/** GET /api/admin-distributed-assignments/for-learner?userId= — PDFs this learner should see. */
export async function listAdminDistributedAssignmentsForLearner(req: Request, res: Response): Promise<void> {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    if (!userId) {
      res.status(400).json({ error: "userId is required." });
      return;
    }
    const user = await usersCol().findOne({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (!user.approved || user.role === "admin") {
      res.json({ assignments: [] });
      return;
    }

    const courses = await coursesCol()
      .find({ published: { $ne: false } })
      .toArray();
    const publishedCourseIds = courses.map((c) => c.id);
    const enr = await enrollmentsCol().find({ userId }).toArray();
    const allowed = allowedCourseIdsForLearner(user, enr, publishedCourseIds);

    const all = await col()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const visible = all.filter((a) => a.courseIds.some((cid) => allowed.has(cid)));
    res.json({ assignments: visible });
  } catch (e) {
    console.error("listAdminDistributedAssignmentsForLearner:", e);
    res.status(500).json({ error: "Failed to load handouts." });
  }
}
