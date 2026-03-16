/**
 * Firebase Firestore storage for users, testimonials, and quizzes.
 * Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path,
 * or use Firebase emulator with FIRESTORE_EMULATOR_HOST.
 */
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "node:fs";
import path from "node:path";

let db: Firestore | null = null;

function parseServiceAccountJson(jsonString: string): ServiceAccount {
  const normalized = jsonString.trim().replace(/^["']|["']$/g, "");
  const cred = JSON.parse(normalized) as ServiceAccount;
  if (!cred.project_id || !cred.private_key) {
    throw new Error("Service account JSON missing project_id or private_key");
  }
  return cred;
}

export function getDb(): Firestore {
  if (db) return db;
  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const credBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (credPath) {
      const normalizedPath = path.normalize(credPath.replace(/^["']|["']$/g, "").trim());
      try {
        const raw = readFileSync(normalizedPath, "utf8");
        const cred = JSON.parse(raw) as ServiceAccount;
        initializeApp({ credential: cert(cred), projectId: cred.projectId, storageBucket: `${cred.projectId ?? cred.project_id}.appspot.com` });
      } catch (e) {
        console.warn("Firestore: failed to read GOOGLE_APPLICATION_CREDENTIALS, using default credentials");
        initializeApp();
      }
    } else if (credBase64) {
      try {
        const raw = credBase64.replace(/\s/g, "").trim();
        const decoded = Buffer.from(raw, "base64").toString("utf8");
        const cred = parseServiceAccountJson(decoded);
        initializeApp({ credential: cert(cred), projectId: cred.project_id, storageBucket: `${cred.project_id}.appspot.com` });
      } catch (e) {
        console.error("Firestore: FIREBASE_SERVICE_ACCOUNT_BASE64 invalid.", e instanceof Error ? e.message : e);
        throw new Error("Firebase config invalid. Check FIREBASE_SERVICE_ACCOUNT_BASE64 is base64-encoded JSON.");
      }
    } else if (credJson) {
      try {
        const cred = parseServiceAccountJson(credJson);
        initializeApp({ credential: cert(cred), projectId: cred.project_id, storageBucket: `${cred.project_id}.appspot.com` });
      } catch (e) {
        console.error("Firestore: FIREBASE_SERVICE_ACCOUNT invalid.", e instanceof Error ? e.message : e);
        throw new Error("Firebase config invalid. Use FIREBASE_SERVICE_ACCOUNT (single-line JSON) or FIREBASE_SERVICE_ACCOUNT_BASE64 to avoid paste issues on Render.");
      }
    } else {
      const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
      if (isProduction) {
        throw new Error(
          "Firebase credentials missing on Render. Set FIREBASE_SERVICE_ACCOUNT_BASE64: run `pnpm run encode:firebase` locally, copy the output, and add it in Render → Environment. Then redeploy."
        );
      }
      initializeApp();
    }
  }
  db = getFirestore();
  return db;
}

export function storage() {
  getDb(); // ensure initialized
  return getStorage();
}

export const COLLECTIONS = {
  users: "users",
  testimonials: "testimonials",
  quizzes: "quizzes",
  courses: "courses",
  enrollments: "enrollments",
  submissions: "submissions",
  progress: "progress",
  inquiries: "inquiries",
} as const;

export function usersCollection() {
  return getDb().collection(COLLECTIONS.users);
}

export function testimonialsCollection() {
  return getDb().collection(COLLECTIONS.testimonials);
}

export function quizzesCollection() {
  return getDb().collection(COLLECTIONS.quizzes);
}

export function coursesCollection() {
  return getDb().collection(COLLECTIONS.courses);
}

export function enrollmentsCollection() {
  return getDb().collection(COLLECTIONS.enrollments);
}

export function submissionsCollection() {
  return getDb().collection(COLLECTIONS.submissions);
}

export function progressCollection() {
  return getDb().collection(COLLECTIONS.progress);
}

export function inquiriesCollection() {
  return getDb().collection(COLLECTIONS.inquiries);
}
