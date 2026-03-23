import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { User, UserCreate, UserPublic, LearnerSector } from "@shared/api";
import {
  getDb,
  usersCollection,
  enrollmentsCollection,
  progressCollection,
  submissionsCollection,
  assignmentSubmissionsCollection,
  passwordResetsCollection,
} from "../lib/firestore";
import {
  notifyNewRegistration,
  notifyLearnerRegistrationReceived,
  notifyLearnerApproved,
  notifyPasswordReset,
} from "../lib/notify";
import type { EnrollmentWithPercent } from "./enrollments";
import { getEnrollmentsForUser } from "./enrollments";
import type { SubmissionDoc } from "@shared/api";

const BCRYPT_ROUNDS = 10;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function isHashed(stored: string): boolean {
  return typeof stored === "string" && stored.startsWith("$2");
}

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (isHashed(stored)) return bcrypt.compare(plain, stored);
  return plain === stored;
}

const VALID_SECTORS: LearnerSector[] = ["construction", "industrial-safety", "mining"];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublic(u: User): UserPublic {
  const { password: _, ...rest } = u;
  return rest;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function postRegister(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as UserCreate;
    const { email, password, name, phone, organization, sector } = body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }
    const phoneVal = typeof phone === "string" ? phone.trim() : "";
    if (!phoneVal) {
      res.status(400).json({ error: "Phone number is required." });
      return;
    }
    const sectorVal = sector && VALID_SECTORS.includes(sector) ? sector : undefined;
    const col = usersCollection();
    const existingSnap = await col.where("email", "==", email.trim().toLowerCase()).limit(1).get();
    if (!existingSnap.empty) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user: User = {
      id: generateId(),
      email: email.trim(),
      password: passwordHash,
      name: name.trim(),
      phone: phoneVal,
      organization: organization?.trim(),
      sector: sectorVal,
      approved: false,
      createdAt: new Date().toISOString(),
    };
    const forFirestore = Object.fromEntries(
      Object.entries(user).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    await col.doc(user.id).set(forFirestore);
    // Notify admin only after successful Firestore write (best option: no email for failed or duplicate registrations)
    notifyNewRegistration({
      name: user.name,
      email: user.email,
      phone: user.phone,
      organization: user.organization,
      sector: user.sector,
      createdAt: user.createdAt,
    }).catch((err) => console.error("[REGISTER] Notify failed:", err));
    notifyLearnerRegistrationReceived({
      name: user.name,
      email: user.email,
    }).catch((err) => console.error("[REGISTER] Learner payment email failed:", err));
    res.status(201).json({ user: toPublic(user) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : "";
    console.error("[REGISTER]", msg);
    if (stack) console.error("[REGISTER stack]", stack);
    res.status(500).json({ error: "Registration failed. Please try again later or contact support." });
  }
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    // Admin login via environment variables (recommended for initial setup)
    const adminEmail = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : "";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "";
    if (adminEmail && adminPassword && normalizeEmail(email) === adminEmail && password === adminPassword) {
      const now = new Date().toISOString();
      const adminUser: User = {
        id: "admin",
        email: adminEmail,
        password: "__env__",
        name: "Administrator",
        approved: true,
        role: "admin",
        createdAt: now,
      };
      res.json({ user: toPublic(adminUser) });
      return;
    }

    const col = usersCollection();
    const snap = await col.where("email", "==", normalizeEmail(email)).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const user = doc.data() as User;
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    // Default to learner role if not set
    if (!user.role) user.role = "learner";
    res.json({ user: toPublic(user) });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed." });
  }
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const snap = await usersCollection().get();
    const list = snap.docs
      .map((d) => toPublic(d.data() as User))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json({ users: list });
  } catch (e) {
    console.error("Get users error:", e);
    res.status(500).json({ error: "Failed to list users." });
  }
}

/** GET /api/users/learners-summary – users plus enrollments with completion % (for admin learners page) */
export async function getLearnersSummary(_req: Request, res: Response): Promise<void> {
  try {
    const snap = await usersCollection().get();
    const users = snap.docs
      .map((d) => toPublic(d.data() as User))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const enrollmentsByUserId: Record<string, EnrollmentWithPercent[]> = {};
    await Promise.all(
      users.map(async (u) => {
        const enrollments = await getEnrollmentsForUser(u.id);
        const subsSnap = await submissionsCollection().where("userId", "==", u.id).get();
        const subs = subsSnap.docs.map(d => d.data() as SubmissionDoc);
        
        // Add best score per assessment to each enrollment's data
        const enriched = enrollments.map(en => {
          const courseSubs = subs.filter(s => s.courseId === en.courseId);
          const quizPerformance = courseSubs.reduce((acc, s) => {
            const existing = acc[s.assessmentId];
            if (!existing || s.percentage > existing.percentage) {
              acc[s.assessmentId] = { score: s.score, maxScore: s.maxScore, percentage: s.percentage, passed: s.passed };
            }
            return acc;
          }, {} as Record<string, { score: number, maxScore: number, percentage: number, passed: boolean }>);
          
          return { ...en, quizPerformance };
        });
        
        enrollmentsByUserId[u.id] = enriched as any;
      })
    );
    res.json({ users, enrollmentsByUserId });
  } catch (e) {
    console.error("Learners summary error:", e);
    res.status(500).json({ error: "Failed to load learners summary." });
  }
}

export async function patchUserApprove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ref = usersCollection().doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    await ref.update({ approved: true });
    const user = doc.data() as User;
    notifyLearnerApproved({ name: user.name, email: user.email }).catch((err) =>
      console.error("[APPROVE] Notify learner failed:", err)
    );
    res.json({ user: toPublic({ ...user, approved: true }) });
  } catch (e) {
    console.error("Approve user error:", e);
    res.status(500).json({ error: "Failed to approve user." });
  }
}

/** GET /api/users/:id – get one user (admin; for edit form). Excludes password in response. */
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === "admin") {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const doc = await usersCollection().doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ user: toPublic(doc.data() as User) });
  } catch (e) {
    console.error("Get user error:", e);
    res.status(500).json({ error: "Failed to load user." });
  }
}

/** POST /api/users – admin create learner. Body: name, email, password, organization?, sector?, approved? */
export async function postUser(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as UserCreate & { approved?: boolean };
    const { email, password, name, organization, sector, approved } = body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }
    const sectorVal = sector && VALID_SECTORS.includes(sector) ? sector : undefined;
    const col = usersCollection();
    const existingSnap = await col.where("email", "==", normalizeEmail(email)).limit(1).get();
    if (!existingSnap.empty) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user: User = {
      id: generateId(),
      email: email.trim(),
      password: passwordHash,
      name: name.trim(),
      organization: organization?.trim(),
      sector: sectorVal,
      approved: approved === true,
      createdAt: new Date().toISOString(),
    };
    const forFirestore = Object.fromEntries(
      Object.entries(user).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    await col.doc(user.id).set(forFirestore);
    res.status(201).json({ user: toPublic(user) });
  } catch (e) {
    console.error("Create user error:", e);
    res.status(500).json({ error: "Failed to create learner." });
  }
}

/** PUT /api/users/:id – admin update learner. Body: name?, email?, password?, organization?, sector?, approved? */
export async function putUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === "admin") {
      res.status(400).json({ error: "Cannot update admin user." });
      return;
    }
    const ref = usersCollection().doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const body = req.body as {
      name?: string;
      email?: string;
      password?: string;
      organization?: string;
      sector?: LearnerSector | "";
      approved?: boolean;
    };
    const current = doc.data() as User;
    const email = body.email !== undefined ? body.email.trim() : current.email;
    if (body.email !== undefined) {
      const col = usersCollection();
      const other = await col.where("email", "==", normalizeEmail(email)).limit(2).get();
      const duplicate = other.docs.find((d) => d.id !== id);
      if (duplicate) {
        res.status(409).json({ error: "Another user already has this email." });
        return;
      }
    }
    const sectorVal =
      body.sector !== undefined
        ? body.sector && VALID_SECTORS.includes(body.sector)
          ? body.sector
          : undefined
        : current.sector;
    const updates: Partial<User> = {
      name: body.name !== undefined ? body.name.trim() : current.name,
      email,
      organization: body.organization !== undefined ? body.organization.trim() : current.organization,
      sector: sectorVal,
      approved: body.approved !== undefined ? body.approved : current.approved,
    };
    if (body.password !== undefined && body.password !== "") {
      updates.password = await hashPassword(body.password);
    }
    const forFirestore = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    await ref.update(forFirestore);
    const updated = (await ref.get()).data() as User;
    const wasJustApproved = body.approved === true && !current.approved;
    if (wasJustApproved) {
      notifyLearnerApproved({ name: updated.name, email: updated.email }).catch((err) =>
        console.error("[APPROVE] Notify learner failed:", err)
      );
    }
    res.json({ user: toPublic(updated) });
  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ error: "Failed to update learner." });
  }
}

/** DELETE /api/users/:id – admin delete learner. Also removes enrollments, progress, submissions for that user. */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === "admin") {
      res.status(400).json({ error: "Cannot delete admin user." });
      return;
    }
    const ref = usersCollection().doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const batch = getDb().batch();
    const enrollments = await enrollmentsCollection().where("userId", "==", id).get();
    enrollments.docs.forEach((d) => batch.delete(d.ref));
    const progressSnap = await progressCollection().where("userId", "==", id).get();
    progressSnap.docs.forEach((d) => batch.delete(d.ref));
    const submissions = await submissionsCollection().where("userId", "==", id).get();
    submissions.docs.forEach((d) => batch.delete(d.ref));
    const assignmentSubs = await assignmentSubmissionsCollection().where("userId", "==", id).get();
    assignmentSubs.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
    res.status(204).send();
  } catch (e) {
    console.error("Delete user error:", e);
    res.status(500).json({ error: "Failed to delete learner." });
  }
}

/** POST /api/forgot-password – request a password reset token. Body: { email } */
export async function postForgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const snap = await usersCollection().where("email", "==", normalizedEmail).limit(1).get();
    
    // Security: always return 200 to avoid account enumeration
    if (snap.empty) {
      res.json({ ok: true, message: "If an account exists, a reset link has been sent." });
      return;
    }

    const user = snap.docs[0].data() as User;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    await passwordResetsCollection().doc(token).set({
      email: normalizedEmail,
      token,
      expiresAt,
    });

    await notifyPasswordReset({ name: user.name, email: user.email, token }).catch(err => {
      console.error("[FORGOT_PWD] Email failed:", err);
    });

    res.json({ ok: true, message: "If an account exists, a reset link has been sent." });
  } catch (e) {
    console.error("Forgot password error:", e);
    res.status(500).json({ error: "Failed to process request." });
  }
}

/** POST /api/reset-password – set new password using token. Body: { token, password } */
export async function postResetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required." });
      return;
    }

    const resetRef = passwordResetsCollection().doc(token);
    const resetSnap = await resetRef.get();
    
    if (!resetSnap.exists) {
      res.status(400).json({ error: "Invalid or expired reset token." });
      return;
    }

    const data = resetSnap.data() as { email: string; expiresAt: number };
    if (Date.now() > data.expiresAt) {
      await resetRef.delete();
      res.status(400).json({ error: "Reset token has expired." });
      return;
    }

    const userSnap = await usersCollection().where("email", "==", data.email).limit(1).get();
    if (userSnap.empty) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const userDoc = userSnap.docs[0];
    const passwordHash = await hashPassword(password);
    
    await userDoc.ref.update({ password: passwordHash });
    await resetRef.delete();

    res.json({ ok: true, message: "Password has been successfully reset." });
  } catch (e) {
    console.error("Reset password error:", e);
    res.status(500).json({ error: "Failed to reset password." });
  }
}
