import { MongoClient, type Db, type Collection, type Document } from "mongodb";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

function inferDbNameFromUri(uri: string): string | null {
  try {
    const u = new URL(uri);
    const path = u.pathname?.replace(/^\//, "").trim();
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export function getMongoDb(): Db {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Set it in Render environment variables.");
  }

  if (dbInstance) return dbInstance;

  if (!client) {
    client = new MongoClient(uri, {
      // Keep defaults; Render networking can be flaky so allow driver retry behavior.
      retryWrites: true,
    });
  }

  const dbName =
    process.env.MONGODB_DB?.trim() ||
    inferDbNameFromUri(uri) ||
    "ksoshtc";

  dbInstance = client.db(dbName);
  return dbInstance;
}

export function mongoCollection<TSchema extends Document = Document>(name: string): Collection<TSchema> {
  return getMongoDb().collection<TSchema>(name);
}

/** Canonical Mongo collection names for the API. */
export const MONGO_COLLECTIONS = {
  /** Learner and admin accounts (register / login / approve). */
  users: "users",
  /** Instructor profiles (admin-managed), linked to users.role=instructor via userId. */
  instructors: "instructors",
  testimonials: "testimonials",
  courses: "courses",
  modules: "modules",
  lessons: "lessons",
  assessments: "assessments",
  /** Per-course final exam (admin). */
  quizzes: "quizzes",
  enrollments: "enrollments",
  /** Module/course quiz attempts (break quizzes + marks). */
  submissions: "submissions",
  assignment_submissions: "assignment_submissions",
  /** Admin PDF handouts with per-course targeting + learner email notifications */
  admin_distributed_assignments: "admin_distributed_assignments",
  progress: "progress",
  /** Contact form submissions (name, email, phone, message). */
  inquiries: "inquiries",
  password_resets: "password_resets",
  certificates: "certificates",
  settings: "settings",
  registrations: "registrations",
  subscribers: "subscribers",
  quotations: "quotations",
} as const;

