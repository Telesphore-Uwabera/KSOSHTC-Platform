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

export const MONGO_COLLECTIONS = {
  users: "users",
  testimonials: "testimonials",
  courses: "courses",
  modules: "modules",
  lessons: "lessons",
  assessments: "assessments",
  quizzes: "quizzes",
  enrollments: "enrollments",
  submissions: "submissions",
  assignment_submissions: "assignment_submissions",
  progress: "progress",
  inquiries: "inquiries",
  password_resets: "password_resets",
} as const;

