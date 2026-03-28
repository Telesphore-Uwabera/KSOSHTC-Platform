import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { User, UserCreate, UserPublic, LearnerSector } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import {
  notifyNewRegistration,
  notifyLearnerRegistrationReceived,
  notifyLearnerApproved,
  notifyPasswordReset,
  notifyPasswordResetSuccessful,
} from "../lib/notify";
import type { EnrollmentWithPercent } from "./enrollments";
import { getEnrollmentsForUser } from "./enrollments";
import type { SubmissionDoc } from "@shared/api";

const BCRYPT_ROUNDS = 10;

function usersCol() {
  return mongoCollection<User>(MONGO_COLLECTIONS.users);
}
function passwordResetsCol() {
  return mongoCollection<{ id: string; email: string; token: string; expiresAt: number }>(
    MONGO_COLLECTIONS.password_resets
  );
}
function submissionsCol() {
  return mongoCollection<SubmissionDoc>(MONGO_COLLECTIONS.submissions);
}

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
    const col = usersCol();
    const existing = await col.findOne({ email: normalizeEmail(email) });
    if (existing) {
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
    const doc = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined)) as User;
    await col.insertOne(doc as any);
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

    const user = await usersCol().findOne({ email: normalizeEmail(email) });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    if (!user.role) user.role = "learner";
    res.json({ user: toPublic(user) });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed." });
  }
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const list = await usersCol()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ users: list.map((u) => toPublic(u)) });
  } catch (e) {
    console.error("Get users error:", e);
    res.status(500).json({ error: "Failed to list users." });
  }
}

export async function getLearnersSummary(_req: Request, res: Response): Promise<void> {
  try {
    const users = (await usersCol().find({}).sort({ createdAt: -1 }).toArray()).map((u) => toPublic(u));
    const enrollmentsByUserId: Record<string, EnrollmentWithPercent[]> = {};
    await Promise.all(
      users.map(async (u) => {
        const enrollments = await getEnrollmentsForUser(u.id);
        const subs = await submissionsCol().find({ userId: u.id }).toArray();

        const enriched = enrollments.map((en) => {
          const courseSubs = subs.filter((s) => s.courseId === en.courseId);
          const quizPerformance = courseSubs.reduce(
            (acc, s) => {
              const existing = acc[s.assessmentId];
              if (!existing || s.percentage > existing.percentage) {
                acc[s.assessmentId] = {
                  score: s.score,
                  maxScore: s.maxScore,
                  percentage: s.percentage,
                  passed: s.passed,
                };
              }
              return acc;
            },
            {} as Record<string, { score: number; maxScore: number; percentage: number; passed: boolean }>
          );

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
    const col = usersCol();
    const user = await col.findOne({ id });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    await col.updateOne({ id }, { $set: { approved: true } });
    notifyLearnerApproved({ name: user.name, email: user.email }).catch((err) =>
      console.error("[APPROVE] Notify learner failed:", err)
    );
    res.json({ user: toPublic({ ...user, approved: true }) });
  } catch (e) {
    console.error("Approve user error:", e);
    res.status(500).json({ error: "Failed to approve user." });
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === "admin") {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const user = await usersCol().findOne({ id });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ user: toPublic(user) });
  } catch (e) {
    console.error("Get user error:", e);
    res.status(500).json({ error: "Failed to load user." });
  }
}

export async function postUser(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as UserCreate & { approved?: boolean };
    const { email, password, name, organization, sector, approved } = body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }
    const sectorVal = sector && VALID_SECTORS.includes(sector) ? sector : undefined;
    const col = usersCol();
    const existing = await col.findOne({ email: normalizeEmail(email) });
    if (existing) {
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
    const doc = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined)) as User;
    await col.insertOne(doc as any);
    res.status(201).json({ user: toPublic(user) });
  } catch (e) {
    console.error("Create user error:", e);
    res.status(500).json({ error: "Failed to create learner." });
  }
}

export async function putUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === "admin") {
      res.status(400).json({ error: "Cannot update admin user." });
      return;
    }
    const col = usersCol();
    const current = await col.findOne({ id });
    if (!current) {
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
    const email = body.email !== undefined ? body.email.trim() : current.email;
    if (body.email !== undefined) {
      const duplicate = await col.findOne({
        email: normalizeEmail(email),
        id: { $ne: id },
      });
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
    const $set = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined)) as Partial<User>;
    await col.updateOne({ id }, { $set });
    const updated = (await col.findOne({ id })) as User;
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

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === "admin") {
      res.status(400).json({ error: "Cannot delete admin user." });
      return;
    }
    const col = usersCol();
    const user = await col.findOne({ id });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    await mongoCollection(MONGO_COLLECTIONS.enrollments).deleteMany({ userId: id });
    await mongoCollection(MONGO_COLLECTIONS.progress).deleteMany({ userId: id });
    await mongoCollection(MONGO_COLLECTIONS.submissions).deleteMany({ userId: id });
    await mongoCollection(MONGO_COLLECTIONS.assignment_submissions).deleteMany({ userId: id });
    await col.deleteOne({ id });
    res.status(204).send();
  } catch (e) {
    console.error("Delete user error:", e);
    res.status(500).json({ error: "Failed to delete learner." });
  }
}

export async function postForgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await usersCol().findOne({ email: normalizedEmail });

    if (!user) {
      res.json({ ok: true, message: "If an account exists, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000;

    await passwordResetsCol().insertOne({ id: token, email: normalizedEmail, token, expiresAt });

    await notifyPasswordReset({ name: user.name, email: user.email, token }).catch((err) => {
      console.error("[FORGOT_PWD] Email failed:", err);
    });

    res.json({ ok: true, message: "If an account exists, a reset link has been sent." });
  } catch (e) {
    console.error("Forgot password error:", e);
    res.status(500).json({ error: "Failed to process request." });
  }
}

export async function postResetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required." });
      return;
    }

    const reset = await passwordResetsCol().findOne({ id: token });
    if (!reset) {
      res.status(400).json({ error: "Invalid or expired reset token." });
      return;
    }

    if (Date.now() > reset.expiresAt) {
      await passwordResetsCol().deleteOne({ id: token });
      res.status(400).json({ error: "Reset token has expired." });
      return;
    }

    const user = await usersCol().findOne({ email: reset.email });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const sameAsCurrent = await verifyPassword(password, user.password);
    if (sameAsCurrent) {
      res.status(400).json({
        error: "Your new password must be different from your current password. Choose a new one.",
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    await usersCol().updateOne({ id: user.id }, { $set: { password: passwordHash } });
    await passwordResetsCol().deleteOne({ id: token });

    notifyPasswordResetSuccessful({ name: user.name, email: user.email }).catch((err) => {
      console.error("[RESET_PWD] Confirmation email failed:", err);
    });

    res.json({ ok: true, message: "Password has been successfully reset." });
  } catch (e) {
    console.error("Reset password error:", e);
    res.status(500).json({ error: "Failed to reset password." });
  }
}
