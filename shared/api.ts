/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Testimonial (admin-managed)
 */
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type TestimonialCreate = Omit<Testimonial, "id" | "createdAt">;

/** Sector chosen at registration: determines which main course (+ safety-management) the learner sees */
export type LearnerSector = "construction" | "industrial-safety" | "mining";

/** User (registrant); access to courses only after admin approval */
export interface User {
  id: string;
  email: string;
  password: string; // stored as bcrypt hash; plain-text fallback for legacy users
  name: string;
  phone?: string;
  organization?: string;
  /** Sector of interest: learner sees only this course + safety-management. Omit = see all. */
  sector?: LearnerSector;
  approved: boolean;
  role?: "learner" | "admin";
  createdAt: string;
}

export type UserCreate = Pick<User, "email" | "password" | "name" | "phone" | "organization" | "sector">;
export type UserPublic = Omit<User, "password">;

/** Course identifier (must match client course ids). safety-for-all = common safety course after the three main courses */
export type CourseId =
  | "construction"
  | "industrial-safety"
  | "mining"
  | "safety-management"
  | "safety-for-all";

/** Course document (Firestore) */
export interface CourseDoc {
  id: string;
  slug: CourseId;
  title: string;
  description: string;
  sector: string;
  duration: string;
  coverImageUrl?: string;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Course summary for admin / API (backward compatible) */
export interface CoursePublic {
  id: CourseId;
  title: string;
  sector: string;
  duration: string;
}

/** Module (subunit) under a course */
export interface ModuleDoc {
  id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Lesson under a module: optional YouTube link, optional PDF (stored in Cloudinary), optional text */
export interface LessonDoc {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  order: number;
  youtubeUrl?: string;
  /** Public URL to PDF on Cloudinary */
  pdfUrl?: string;
  contentHtml: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Assessment (break quiz) – can be placed after a specific lesson via afterLessonId and order */
export interface AssessmentDoc {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passThreshold: number;
  published: boolean;
  /** Display order within module (for interleaving with lessons) */
  order: number;
  /** If set, this quiz is a "break" that must be passed before the learner can open the next lesson */
  afterLessonId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Enrollment status for admin/learners view */
export type EnrollmentStatus = "not_approved" | "active" | "completed";

/** Enrollment: learner enrolled in course */
export interface EnrollmentDoc {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  status?: EnrollmentStatus;
}

/** Submission: learner's quiz attempt */
export interface SubmissionDoc {
  id: string;
  userId: string;
  courseId: string;
  assessmentId: string;
  moduleId: string;
  answers: number[]; // selected option index per question
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

/** PDF work submission for an enrolled course (separate from quiz SubmissionDoc). */
export interface AssignmentSubmissionDoc {
  id: string;
  userId: string;
  courseId: string;
  /** Short label, e.g. module or task name */
  title: string;
  pdfUrl: string;
  originalFilename: string;
  submittedAt: string;
  learnerName?: string;
  learnerEmail?: string;
  courseTitle?: string;
  /** null/omitted = not graded yet */
  marks?: number | null;
  maxMarks?: number;
  feedback?: string;
  gradedAt?: string;
}

/** Progress: learner progress in a course (used to gate next PDF until break quiz passed) */
export interface ProgressDoc {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  /** Break quizzes passed (required to unlock next lesson when afterLessonId is set) */
  completedAssessmentIds: string[];
  lastLessonId?: string;
  updatedAt: string;
}

/** Single quiz/assessment question (multiple choice) */
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

/** Quiz or assessment attached to a course (set by admin) */
export interface Quiz {
  id: string;
  courseId: CourseId;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passThreshold: number; // 0–100 percentage
  createdAt: string;
  updatedAt: string;
}

export type QuizCreate = Omit<Quiz, "id" | "createdAt" | "updatedAt">;
export type QuizUpdate = Partial<Omit<Quiz, "id" | "courseId" | "createdAt">> & { updatedAt: string };

/** Per-course usage for dashboard analytics (main dashboard only) */
export interface CourseUsageItem {
  courseId: string;
  title: string;
  sector: string;
  duration: string;
  hasQuiz: boolean;
  enrollmentCount: number;
  completionCount: number;
  completionRatePercent: number;
}
