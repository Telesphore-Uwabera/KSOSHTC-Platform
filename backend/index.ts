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
} from "./routes/course-content";
import { postEnrollment, getEnrollments, patchEnrollment } from "./routes/enrollments";
import { getProgress, patchProgress } from "./routes/progress";
import { postContact } from "./routes/contact";
import { getDb, usersCollection } from "./lib/firestore";

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
  app.get("/courses/", (_req, res) => {
    res.status(404).json({
      error: "Not found",
      message: "The /courses page is served by the frontend. Use the app URL (e.g. Netlify) to open the Courses page.",
    });
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
      const db = getDb();
      // Prove credentials work with a minimal read (otherwise health can pass but register fails with UNAUTHENTICATED)
      await usersCollection().limit(1).get();
      console.log("[HEALTH] Firestore OK");
      res.status(200).json({ ok: true, firestore: "connected" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[HEALTH] Firestore FAIL:", msg);
      res.status(503).json({ ok: false, firestore: "error", error: msg });
    }
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Testimonials (admin-managed)
  app.get("/api/testimonials", getTestimonials);
  app.post("/api/testimonials", postTestimonial);

  // Contact form (saved to Firestore)
  app.post("/api/contact", postContact);

  // Users: register, login, list (admin), approve (admin), CRUD (admin)
  app.post("/api/register", postRegister);
  app.post("/api/login", postLogin);
  app.get("/api/users", getUsers);
  app.get("/api/users/learners-summary", getLearnersSummary);
  app.get("/api/users/:id", getUser);
  app.patch("/api/users/:id/approve", patchUserApprove);
  app.post("/api/users", postUser);
  app.put("/api/users/:id", putUser);
  app.delete("/api/users/:id", deleteUser);

  // Courses (list) and per-course quiz (get, create/update, delete)
  app.get("/api/courses", getCourses);
  app.get("/api/courses/:courseId/quiz", getCourseQuiz);
  app.put("/api/courses/:courseId/quiz", putCourseQuiz);
  app.delete("/api/courses/:courseId/quiz", deleteCourseQuiz);

  // Analytics (for main dashboard only)
  app.get("/api/analytics/course-usage", getCourseUsage);

  // Course content (Firestore): courses, modules, lessons, assessments
  app.get("/api/course-content/courses", listCourseContent);
  app.post("/api/course-content/courses/:courseId/upload-pdf", uploadCoursePdf);
  app.post("/api/course-content/courses/:courseId/cover-image", uploadCourseCover);
  app.get("/api/course-content/courses/:courseId", getCourse);
  app.get("/api/course-content/courses/:courseId/stats", getCourseStats);
  app.post("/api/course-content/courses", createCourse);
  app.put("/api/course-content/courses/:courseId", updateCourse);
  app.get("/api/course-content/courses/:courseId/modules", listModules);
  app.post("/api/course-content/courses/:courseId/modules", createModule);
  app.put("/api/course-content/courses/:courseId/modules/:moduleId", updateModule);
  app.delete("/api/course-content/courses/:courseId/modules/:moduleId", deleteModule);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/lessons", listLessons);
  app.post("/api/course-content/courses/:courseId/modules/:moduleId/lessons", createLesson);
  app.put("/api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId", updateLesson);
  app.delete("/api/course-content/courses/:courseId/modules/:moduleId/lessons/:lessonId", deleteLesson);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/assessments", listAssessments);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/items", getModuleItems);
  app.get("/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId", getAssessment);
  app.post("/api/course-content/courses/:courseId/modules/:moduleId/assessments", createAssessment);
  app.put("/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId", updateAssessment);
  app.delete("/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId", deleteAssessment);
  app.post("/api/course-content/courses/:courseId/modules/:moduleId/assessments/:assessmentId/submit", submitAssessment);
  app.get("/api/submissions", getSubmissions);

  app.post("/api/enrollments", postEnrollment);
  app.get("/api/enrollments", getEnrollments);
  app.patch("/api/enrollments/:id", patchEnrollment);
  app.get("/api/progress", getProgress);
  app.patch("/api/progress", patchProgress);

  return app;
}
