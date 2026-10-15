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
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type TestimonialCreate = Omit<Testimonial, "id" | "createdAt" | "updatedAt"> & {
  avatarFile?: {
    filename: string;
    contentBase64: string;
  };
};

export type TestimonialUpdate = Partial<TestimonialCreate>;

/** Sector chosen at registration: determines which main course (+ safety-management) the learner sees */
export type LearnerSector =
  | "construction"
  | "industrial-safety"
  | "mining"
  | "food-safety"
  | "safety-management"
  | "safe-lifting-operations"
  | "fire-safety-and-egress"
  | "esg"
  | "first-aid";

export type UserRole = "learner" | "admin" | "instructor";

/** User (registrant); access to courses only after admin approval */
export interface User {
  id: string;
  /** System-assigned student ID card number, format YYYY-NNNN (e.g. 2026-0001). Used as a unique human-readable identifier on receipts and certificates. */
  idCardNo?: string;
  email: string;
  password: string; // stored as bcrypt hash; plain-text fallback for legacy users
  name: string;
  phone?: string;
  organization?: string;
  /** Sector of interest: learner sees only this course + safety-management. Omit = see all. */
  sector?: LearnerSector;
  approved: boolean;
  role?: UserRole;
  createdAt: string;
}

export type UserCreate = Pick<User, "email" | "password" | "name" | "phone" | "organization" | "sector">;
export type UserPublic = Omit<User, "password">;

/** Instructor profile (admin-managed); linked to a User with role=instructor */
export interface Instructor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  staffId?: string;
  organization?: string;
  sector?: LearnerSector;
  /** Courses this instructor may manage/review. Empty/omitted means none. */
  allowedCourseIds: CourseId[];
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InstructorCreate = Omit<Instructor, "id" | "createdAt" | "updatedAt">;

/** Course identifier (must match client course ids). safety-for-all = common safety course after the three main courses */
export type CourseId =
  | "construction"
  | "industrial-safety"
  | "mining"
  | "safety-management"
  | "food-safety"
  | "safe-lifting-operations"
  | "fire-safety-and-egress"
  | "esg"
  | "first-aid"
  | "safety-for-all";

/** Course document (MongoDB) */
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

/**
 * Admin-uploaded PDF (assignment / quiz handout) distributed to learners by target courses.
 * Notifications go only to learners whose allowed courses intersect targetCourseIds.
 */
export interface AdminDistributedAssignmentDoc {
  id: string;
  title: string;
  description?: string;
  pdfUrl: string;
  originalFilename: string;
  /** e.g. construction, mining, industrial-safety, safety-management */
  courseIds: string[];
  /** Who published this file (admin or instructor). Optional for legacy rows. */
  createdByUserId?: string;
  createdByRole?: "admin" | "instructor";
  createdByName?: string;
  createdAt: string;
}

/** PDF work submission for an enrolled course (separate from quiz SubmissionDoc). */
export interface AssignmentSubmissionDoc {
  id: string;
  userId: string;
  courseId: string;
  /** Linked distributed assignment (when learner submits from a shared assignment). */
  assignmentId?: string;
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

export interface SettingsDoc {
  id: "singleton";
  isRegistrationActive: boolean;
}

export interface RegistrationSubmissionDoc {
  id: string;
  names: string;
  email: string;
  phone: string;
  courses: string[];
  registrationFeeReceiptUrl?: string;
  tuitionFeeReceiptUrl?: string;
  highestDegreeUrls?: string[];
  submittedAt: string;
}

export interface SubscriberDoc {
  email: string;
  subscribedAt: string;
}

/** Quotation & Proforma Types */
export interface QuotationModule {
  id: string;
  title: string;
  bullets: string[];
}

export interface QuotationTrainer {
  id: string;
  name: string;
  title: string;
  bio: string;
  certifications: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  clientName: string;
  location: string;
  numberOfParticipants: number;
  costPerPerson: number;
  totalCost: number;
  duration: string;
  paymentInfo: {
    bankName: string;
    accountNo: string;
    accountName: string;
  };
  modules: QuotationModule[];
  trainingMethodology: string[];
  includedInFee: string[];
  paymentTerms: string[];
  additionalInfo: string[];
  trainers: QuotationTrainer[];
  preparedBy: {
    name: string;
    title: string;
  };
  motto: string;
  createdAt: string;
  updatedAt?: string;
}

export const FIXED_PAYMENT_INFO = {
  bankName: "EQUITY BANK RWANDA",
  accountNo: "4025201372795",
  accountName: "Kigali Safety OSH Training Center",
};

export const FIXED_MOTTO = "Safety today, prosperity tomorrow.";

/** Fee Receipt Types */
export interface ReceiptInvoiceItem {
  id: string;
  invoiceNo: string;
  packageDetails: string;
  feesDetails: string;
  invoiceDate: string;
  dueFee: number;
  receivedFee: number;
}

export interface ReceiptInstallmentItem {
  id: string;
  dueDate: string;
  invoiceNo: string;
  dueFee: number;
  receivedFee: number;
  balanceFee: number;
  paymentDetails: string;
}

export interface FeeReceipt {
  id: string; // Internal UUID or matches invoiceId
  invoiceId: string; // Primary Key: Invoice ID (e.g. INV-7395 or 7395)
  receiptNo: string;
  receiptDate: string;
  receivedIn: string;
  chequeTranNo?: string;
  receivedFee: number;
  currency: string; // Default "RWF"

  // Student / Payer Details
  receivedFrom: string;
  idCardNo: string;
  payerEmail?: string;
  payerPhone?: string;

  // Company / Institution Header Info
  companyName: string;
  companyTagline?: string;
  companyAddress?: string;
  panNumber?: string;
  gstinNumber?: string;
  logoUrl?: string;

  // Signature and Official Stamp
  signatoryName?: string;
  signatoryTitle?: string;
  showStamp?: boolean;
  showSignature?: boolean;
  stampUrl?: string;

  // Invoice & Installment Tables
  invoiceDetails: ReceiptInvoiceItem[];
  installments: ReceiptInstallmentItem[];

  // Terms & Conditions
  termsAndConditions: string[];
  policyUrl?: string;

  // Status & Timestamps
  sentAt?: string;
  sentTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export type FeeReceiptCreate = Omit<FeeReceipt, "id" | "createdAt" | "updatedAt">;
export type FeeReceiptUpdate = Partial<FeeReceiptCreate>;

export const DEFAULT_RECEIPT_TERMS = [
  "Fees can be paid in installments. Course materials and platform access are provided upon payment of the 1st installment at registration. Registration fees are non-refundable.",
  "Payments must be deposited to official Kigali Safety OSH Training Center accounts (Equity Bank Rwanda or official MTN/Airtel MoMo). Banking and platform transfer fees are borne by the student.",
  "The student should strictly adhere to the training batch and schedule timings specified by Kigali Safety OSH Training Center.",
  "The student is required to produce this official payment receipt at the time of collecting the Certificate of Competence.",
  "For refund and administrative policies, kindly review our official terms at our center link below.",
];

/** Team Member Types */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type TeamMemberCreate = Omit<TeamMember, "id" | "createdAt" | "updatedAt"> & {
  avatarFile?: {
    filename: string;
    contentBase64: string;
  };
};

export type TeamMemberUpdate = Partial<TeamMemberCreate>;


