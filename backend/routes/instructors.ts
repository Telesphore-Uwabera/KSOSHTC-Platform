import type { Request, Response } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Instructor, InstructorCreate, LearnerSector, User } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { notifyInstructorCreated, notifyPasswordReset } from "../lib/notify";

const BCRYPT_ROUNDS = 10;
const VALID_SECTORS: LearnerSector[] = ["construction", "industrial-safety", "mining"];

function instructorsCol() {
  return mongoCollection<Instructor>(MONGO_COLLECTIONS.instructors);
}
function usersCol() {
  return mongoCollection<User>(MONGO_COLLECTIONS.users);
}
function passwordResetsCol() {
  return mongoCollection<{ id: string; email: string; token: string; expiresAt: number }>(MONGO_COLLECTIONS.password_resets);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Match user by email regardless of stored casing. */
function findUserByEmail(col: ReturnType<typeof usersCol>, email: string) {
  const emailNorm = normalizeEmail(email);
  return col.findOne({
    $expr: { $eq: [{ $toLower: "$email" }, emailNorm] },
  } as Parameters<typeof col.findOne>[0]);
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function omitMongoId<T extends Record<string, any>>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  return rest;
}

export async function listInstructors(_req: Request, res: Response): Promise<void> {
  try {
    const list = await instructorsCol().find({}).sort({ createdAt: -1 }).toArray();
    res.json({ instructors: list.map((d) => omitMongoId(d) as Instructor) });
  } catch (e) {
    console.error("listInstructors:", e);
    res.status(500).json({ error: "Failed to list instructors." });
  }
}

export async function createInstructor(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Partial<InstructorCreate> & {
      name?: string;
      email?: string;
      phone?: string;
      staffId?: string;
      organization?: string;
      sector?: LearnerSector | "";
      allowedCourseIds?: string[];
      active?: boolean;
      notes?: string;
      /** Optional: when provided, store this as the initial password and email the credentials. */
      password?: string;
    };

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    if (!name || !email) {
      res.status(400).json({ error: "name and email are required." });
      return;
    }
    const emailNorm = normalizeEmail(email);
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const staffId = typeof body.staffId === "string" ? body.staffId.trim() : undefined;
    const organization = typeof body.organization === "string" ? body.organization.trim() : undefined;
    const sector =
      body.sector !== undefined
        ? body.sector && VALID_SECTORS.includes(body.sector)
          ? body.sector
          : undefined
        : undefined;
    const allowedCourseIds = Array.isArray(body.allowedCourseIds)
      ? [...new Set(body.allowedCourseIds.map((c) => String(c).trim()).filter(Boolean))]
      : [];
    const sectorCourseGate: LearnerSector | undefined = sector;
    const finalAllowedCourseIds =
      allowedCourseIds.length > 0
        ? allowedCourseIds
        : sectorCourseGate
          ? ([sectorCourseGate, "safety-management"] as string[])
          : [];
    const active = body.active !== undefined ? Boolean(body.active) : true;
    const notes = typeof body.notes === "string" ? body.notes : undefined;

    const users = usersCol();
    const existing = await findUserByEmail(users, emailNorm);
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const userId = generateId();
    const user: User = {
      id: userId,
      email: emailNorm,
      password: body.password ? await hashPassword(String(body.password)) : await hashPassword(crypto.randomBytes(24).toString("base64url")),
      name,
      phone,
      organization,
      sector,
      approved: true,
      role: "instructor",
      createdAt: new Date().toISOString(),
    };
    const userDoc = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined)) as User;
    await users.insertOne(userDoc as any);

    const now = new Date().toISOString();
    const instructor: Instructor = {
      id: crypto.randomUUID(),
      userId,
      name,
      email: emailNorm,
      phone,
      staffId,
      organization,
      sector,
      allowedCourseIds: finalAllowedCourseIds as any,
      active,
      notes,
      createdAt: now,
      updatedAt: now,
    };
    const instDoc = Object.fromEntries(Object.entries(instructor).filter(([, v]) => v !== undefined)) as Instructor;
    await instructorsCol().insertOne(instDoc as any);

    if (body.password && String(body.password).trim()) {
      // Email the credentials directly (instructor uses main login `/login`).
      await notifyInstructorCreated({
        name,
        email: emailNorm,
        tempPassword: String(body.password),
      }).catch((err) => console.error("[INSTRUCTOR_CREATE] Welcome email failed:", err));
    } else {
      // Force password setup via reset link.
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 60 * 60 * 1000;
      await passwordResetsCol().insertOne({ id: token, email: emailNorm, token, expiresAt });
      await notifyPasswordReset({ name, email: emailNorm, token }).catch((err) => {
        console.error("[INSTRUCTOR_CREATE] Password reset email failed:", err);
      });
    }

    res.status(201).json({ instructor });
  } catch (e) {
    console.error("createInstructor:", e);
    res.status(500).json({ error: "Failed to create instructor." });
  }
}

export async function updateInstructor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const col = instructorsCol();
    const snap = await col.findOne({ id });
    if (!snap) {
      res.status(404).json({ error: "Instructor not found." });
      return;
    }
    const current = omitMongoId(snap) as Instructor;
    const body = req.body as Partial<InstructorCreate> & {
      email?: string;
      sector?: LearnerSector | "";
      allowedCourseIds?: string[];
    };

    const email = body.email !== undefined ? normalizeEmail(String(body.email)) : current.email;
    if (body.email !== undefined) {
      const duplicate = await findUserByEmail(usersCol(), email);
      if (duplicate && duplicate.id !== current.userId) {
        res.status(409).json({ error: "Another account already has this email." });
        return;
      }
    }
    const sector =
      body.sector !== undefined
        ? body.sector && VALID_SECTORS.includes(body.sector)
          ? body.sector
          : undefined
        : current.sector;

    const allowedCourseIds =
      body.allowedCourseIds !== undefined
        ? [...new Set((body.allowedCourseIds ?? []).map((c) => String(c).trim()).filter(Boolean))]
        : current.allowedCourseIds ?? [];

    const updated: Instructor = {
      ...current,
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.phone !== undefined && { phone: body.phone ? String(body.phone).trim() : undefined }),
      ...(body.staffId !== undefined && { staffId: body.staffId ? String(body.staffId).trim() : undefined }),
      ...(body.organization !== undefined && { organization: body.organization ? String(body.organization).trim() : undefined }),
      ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : undefined }),
      ...(body.active !== undefined && { active: Boolean(body.active) }),
      ...(body.email !== undefined && { email }),
      ...(body.sector !== undefined && { sector }),
      ...(body.allowedCourseIds !== undefined && { allowedCourseIds: allowedCourseIds as any }),
      updatedAt: new Date().toISOString(),
    };

    await col.replaceOne({ id }, updated as any);

    // Keep linked User in sync for login & display.
    const uUpdates: Partial<User> = {
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      organization: updated.organization,
      sector: updated.sector,
      role: "instructor",
      approved: true,
    };
    const $set = Object.fromEntries(Object.entries(uUpdates).filter(([, v]) => v !== undefined)) as Partial<User>;
    await usersCol().updateOne({ id: updated.userId }, { $set });

    res.json({ instructor: updated });
  } catch (e) {
    console.error("updateInstructor:", e);
    res.status(500).json({ error: "Failed to update instructor." });
  }
}

export async function deleteInstructor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const col = instructorsCol();
    const snap = await col.findOne({ id });
    if (!snap) {
      res.status(404).json({ error: "Instructor not found." });
      return;
    }
    const inst = omitMongoId(snap) as Instructor;

    await col.deleteOne({ id });
    await usersCol().deleteOne({ id: inst.userId });
    res.status(204).send();
  } catch (e) {
    console.error("deleteInstructor:", e);
    res.status(500).json({ error: "Failed to delete instructor." });
  }
}

