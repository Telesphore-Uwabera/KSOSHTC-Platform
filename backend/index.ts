import path from "node:path";
import { config as loadEnv } from "dotenv";

// Backend uses backend/.env only (see backend/.env.example)
loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getTestimonials, postTestimonial } from "./routes/testimonials";
import {
  postRegister,
  postLogin,
  getUsers,
  getUser,
  getLearnersSummary,
  patchUserApprove,
  postUser,
  putUser,
  deleteUser,
  postForgotPassword,
  postResetPassword,
} from "./routes/users";
import { getCourses, getCourseQuiz, putCourseQuiz, deleteCourseQuiz } from "./routes/courses";
import { getCourseUsage } from "./routes/analytics";
import {
  listCourses as listCourseContent,
  uploadCoursePdf,
  uploadCourseCover,
  getCourse,
  getCourseStats,
  createCourse,
  updateCourse,
  listModules,
  createModule,
  updateModule,
  deleteModule,
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getModuleItems,
  getSubmissions,
  resolveCoursePdf,
  streamCourseDocument,
} from "./routes/course-content";
import {
  postAssignmentSubmission,
  getAssignmentSubmissions,
  patchAssignmentSubmission,
} from "./routes/assignment-submissions";
import {
  postAdminDistributedAssignment,
  listAdminDistributedAssignments,
  listAdminDistributedAssignmentsForLearner,
} from "./routes/admin-distributed-assignments";
import { postEnrollment, getEnrollments, patchEnrollment } from "./routes/enrollments";
import { getProgress, patchProgress } from "./routes/progress";
import { postContact } from "./routes/contact";
import { createCertificate, getCertificate, getAllCertificates, updateCertificate, deleteCertificate, sendEmailCertificate } from "./routes/certificates";
import { getMongoDb, mongoCollection, MONGO_COLLECTIONS } from "./lib/mongo";
import { getAdminSessionSecret, requireAdminSession } from "./lib/adminSession";
import { rateLimitLogin, rateLimitRegister } from "./lib/rateLimit";
import type { LessonDoc } from "@shared/api";

/** Log each request and response to the terminal (method, path, status, duration) */
function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const path = req.originalUrl || req.url;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
    console.log(
      `${new Date().toISOString()} ${method} ${path} ${statusColor}${status}\x1b[0m ${duration}ms`
    );
  });
  next();
}

export function createServer(options?: { apiOnly?: boolean }) {
  const app = express();
  const apiOnly = options?.apiOnly === true;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));
  app.use(requestLogger);

  // Static assets: only paths like /courses/:sector/:file (e.g. /courses/construction/1.pdf) are served here.
  // GET /courses and GET /courses/ are SPA routes on the frontend; if hit on backend, return 404 with guidance.
  app.get("/courses", (_req, res) => {
    res.status(404).json({
      error: "Not found",
      message: "The /courses page is served by the frontend. Use the app URL (e.g. Netlify) to open the Courses page.",
    });
  });

  // SMART REDIRECTOR: Intercept legacy relative paths and redirect to Cloudinary if possible.
  // Supports both /courses/... and /api/courses/...
  app.get(["/courses/:sector/:filename", "/api/courses/:sector/:filename"], async (req, res, next) => {
    try {
      const { filename } = req.params;
      const cleanFile = decodeURIComponent(filename)
        .replace(/[^a-zA-Z0-9]/g, "") // Keep only alphanumeric for fuzzy matching
        .toLowerCase();
      
      if (!cleanFile) return next();

      console.log(`[REDIRECT_PROBE] Searching for legacy file match: ${cleanFile}`);

      const lessons = await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons).find({}).toArray();
      const lesson = lessons.find((row) => {
        const pdf = (row.pdfUrl || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
        const title = (row.title || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
        return (pdf && pdf.includes(cleanFile)) || (title && title.includes(cleanFile)) || cleanFile.includes(title);
      });

      if (lesson) {
        const pdfUrl = lesson.pdfUrl;
        if (pdfUrl && pdfUrl.startsWith("http")) {
          console.log(`[REDIRECT_SUCCESS] Mapping legacy file ${filename} -> ${pdfUrl}`);
          res.redirect(301, pdfUrl);
          return;
        }
      }
    } catch (e) {
      console.error("[REDIRECT_ERR]", e);
    }
    next();
  });

  app.use("/courses", express.static(path.resolve(process.cwd(), "public", "courses")));
  app.use("/course-covers", express.static(path.resolve(process.cwd(), "public", "course-covers")));

  // Only register / and /api when running standalone (not inside Vite). When apiOnly, let Vite serve / so the website loads.
  if (!apiOnly) {
    const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_URI || "http://localhost:8080";
    app.get("/", (_req, res) => {
      res.json({
        service: "backend",
        message: "API server. Use the frontend for the website.",
        api: "/api",
        frontend: frontendUrl,
      });
    });
    app.get("/api", (_req, res) => {
      res.json({
        message: "API root. Use endpoints like /api/ping, /api/courses, /api/users, etc.",
        frontend: frontendUrl,
      });
    });
  }

  app.get("/health", async (_req, res) => {
    try {
      await getMongoDb().command({ ping: 1 });
      console.log("[HEALTH] MongoDB OK");
      res.status(200).json({ ok: true, mongodb: "connected" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[HEALTH] MongoDB FAIL:", msg);
      res.status(503).json({ ok: false, mongodb: "error", error: msg });
    }
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  /** Lets the SPA know whether admin routes require a Bearer token (when ADMIN_SESSION_SECRET is set). */
  app.get("/api/auth/admin-session-required", (_req, res) => {
    res.json({ adminSessionRequired: !!getAdminSessionSecret() });
  });

  app.get("/api/demo", handleDemo);

  // Testimonials (admin-managed)
  app.get("/api/testimonials", getTestimonials);
  app.post("/api/testimonials", requireAdminSession, postTestimonial);

  // Contact form (saved to MongoDB)
  app.post("/api/contact", postContact);

  // Users: register, login, list (admin), approve (admin), CRUD (admin)
  app.post("/api/register", rateLimitRegister, postRegister);
  app.post("/api/login", rateLimitLogin, postLogin);
  app.get("/api/users", requireAdminSession, getUsers);
  app.get("/api/users/learners-summary", requireAdminSession, getLearnersSummary);
  app.get("/api/users/:id", getUser);
  app.patch("/api/users/:id/approve", requireAdminSession, patchUserApprove);
  app.post("/api/forgot-password", postForgotPassword);
  app.post("/api/reset-password", postResetPassword);
  app.post("/api/users", requireAdminSession, postUser);
  app.put("/api/users/:id", requireAdminSession, putUser);
  app.delete("/api/users/:id", requireAdminSession, deleteUser);

  // Courses (list) and per-course quiz (get, create/update, delete)
  app.get("/api/courses", getCourses);
  app.get("/api/courses/:courseId/quiz", getCourseQuiz);
  app.put("/api/courses/:courseId/quiz", requireAdminSession, putCourseQuiz);
  app.delete("/api/courses/:courseId/quiz", requireAdminSession, deleteCourseQuiz);

  app.post(
    "/api/admin/test-email",
    requireAdminSession,
    async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required." });
      const { testEmail } = await import("./lib/notify");
      const result = await testEmail(email);
      if (result.success) res.json(result);
      else res.status(500).json(result);
    }
  );

  // Analytics (for main dashboard only)
  app.get("/api/analytics/course-usage", requireAdminSession, getCourseUsage);

  // Course content (Firestore): courses, modules, lessons, assessments
  app.get("/api/course-content/courses", listCourseContent);
  app.post("/api/course-content/courses/:courseId/upload-pdf", requireAdminSession, uploadCoursePdf);
  app.post("/api/course-content/courses/:courseId/cover-image", requireAdminSession, uploadCourseCover);
  app.get("/api/course-content/courses/:courseId", getCourse);
  app.get("/api/course-content/courses/:courseId/stats", getCourseStats);
  app.post("/api/course-content/courses", requireAdminSession, createCourse);
  app.put("/api/course-content/courses/:courseId", requireAdminSession, updateCourse);
  app.get("/api/course-content/courses/:courseId/modules", listModules);
  app.post("/api/course-content/courses/:courseId/modules", requireAdminSession, createModule);
  app.put("/api/course-content/courses/:courseId/modules/:moduleId", requireAdminSession, updateModule);
  app.delete("/api/course-content/courses/:courseId/modules/:moduleId", requireAdminSession, deleteModule);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/lessons", listLessons);
  app.post("/api/course-content/courses/:courseId/modules/:moduleId/lessons", requireAdminSession, createLesson);
  app.put(
    "/api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId",
    requireAdminSession,
    updateLesson
  );
  app.delete(
    "/api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId",
    requireAdminSession,
    deleteLesson
  );
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/assessments", listAssessments);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/items", getModuleItems);
  app.get("/api/course-content/stream-document", streamCourseDocument);
  app.get("/api/course-content/courses/:courseId/resolve-pdf", resolveCoursePdf);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId", getAssessment);
  app.post(
    "/api/course-content/courses/:courseId/modules/:moduleId/assessments",
    requireAdminSession,
    createAssessment
  );
  app.put(
    "/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId",
    requireAdminSession,
    updateAssessment
  );
  app.delete(
    "/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId",
    requireAdminSession,
    deleteAssessment
  );
  app.post("/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId/submit", submitAssessment);
  app.get("/api/submissions", getSubmissions);

  app.post("/api/assignment-submissions", postAssignmentSubmission);
  app.get("/api/assignment-submissions", getAssignmentSubmissions);
  app.patch("/api/assignment-submissions/:id", requireAdminSession, patchAssignmentSubmission);

  app.get("/api/admin-distributed-assignments/for-learner", listAdminDistributedAssignmentsForLearner);
  app.post("/api/admin-distributed-assignments", requireAdminSession, postAdminDistributedAssignment);
  app.get("/api/admin-distributed-assignments", requireAdminSession, listAdminDistributedAssignments);

  app.post("/api/enrollments", postEnrollment);
  app.get("/api/enrollments", getEnrollments);
  app.patch("/api/enrollments/:id", requireAdminSession, patchEnrollment);
  app.get("/api/progress", getProgress);
  app.patch("/api/progress", patchProgress);

  // Certificates
  app.post("/api/certificates", requireAdminSession, createCertificate);
  app.get("/api/certificates", requireAdminSession, getAllCertificates);
  app.get("/api/certificates/:id", getCertificate);
  app.patch("/api/certificates/:id", requireAdminSession, updateCertificate);
  app.delete("/api/certificates/:id", requireAdminSession, deleteCertificate);
  app.post("/api/certificates/:id/send-email", requireAdminSession, sendEmailCertificate);

  return app;
}
