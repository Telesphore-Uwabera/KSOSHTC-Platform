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
import { issueAdminSessionToken } from "../lib/adminSession";
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

const VALID_SECTORS: LearnerSector[] = [
  "construction",
  "industrial-safety",
  "mining",
  "food-safety",
  "safety-management",
  "safe-lifting-operations",
  "fire-safety-and-egress",
  "esg",
  "first-aid",
  "iso-45001",
  "iso-14011",
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Match learner by email regardless of legacy stored casing (older rows may not be lowercased). */
function findUserByEmail(col: ReturnType<typeof usersCol>, email: string) {
  const emailNorm = normalizeEmail(email);
  return col.findOne({
    $expr: { $eq: [{ $toLower: "$email" }, emailNorm] },
  } as Parameters<typeof col.findOne>[0]);
}

function isMongoDuplicateKeyError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;
}

function toPublic(u: User): UserPublic {
  const { password: _, ...rest } = u;
  return rest;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const SECTOR_ID_CODES: Record<string, string> = {
  "construction": "CONS",
  "mining": "MIN",
  "industrial-safety": "IND",
  "food-safety": "FOOD",
  "safety-management": "SM",
  "safe-lifting-operations": "LIFT",
  "fire-safety-and-egress": "FIRE",
  "esg": "ESG",
  "first-aid": "FA",
  "iso-45001": "ISO45",
  "iso-14011": "ISO14",
};

export function getSectorCode(sector?: string): string {
  if (!sector) return "GEN";
  const s = sector.toLowerCase().trim();
  return SECTOR_ID_CODES[s] || s.slice(0, 4).toUpperCase();
}

/**
 * Generates the next sequential student ID card number in YYYY-SECTOR-NNN format.
 * E.g. 2026-CONS-001, 2026-MIN-003 …
 */
export async function generateIdCardNo(sector?: string, customYear?: number): Promise<string> {
  const year = customYear || new Date().getFullYear();
  const secCode = getSectorCode(sector);
  const prefix = `${year}-${secCode}-`;
  try {
    const col = usersCol();
    const docs = await col
      .find({ idCardNo: { $regex: `^${year}-${secCode}-\\d+` } })
      .project({ idCardNo: 1 })
      .toArray();

    let maxSeq = 0;
    for (const d of docs) {
      if (typeof d.idCardNo === "string") {
        const parts = d.idCardNo.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
  } catch {
    return `${prefix}${String(Date.now()).slice(-3).padStart(3, "0")}`;
  }
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
    const emailNorm = normalizeEmail(email);
    const existing = await findUserByEmail(col, email);
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const idCardNo = await generateIdCardNo(sectorVal);
    const user: User = {
      id: generateId(),
      idCardNo,
      email: emailNorm,
      password: passwordHash,
      name: name.trim(),
      phone: phoneVal,
      organization: organization?.trim(),
      sector: sectorVal,
      approved: false,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      createdAt: new Date().toISOString(),
    };
    const doc = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined)) as User;
    try {
      await col.insertOne(doc as any);
    } catch (e) {
      if (isMongoDuplicateKeyError(e)) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }
      throw e;
    }
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
    if (isMongoDuplicateKeyError(e)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
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
      const adminSessionToken = issueAdminSessionToken({ role: "admin", userId: adminUser.id });
      if (adminSessionToken) {
        res.json({ user: toPublic(adminUser), adminSessionToken });
      } else {
        res.json({
          user: toPublic(adminUser),
          adminSessionWarning:
            "Set ADMIN_SESSION_SECRET in server environment to protect admin APIs with this session token.",
        });
      }
      return;
    }

    const user = await findUserByEmail(usersCol(), email);
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
    const publicUser = toPublic(user);
    if (user.role === "admin" || user.role === "instructor") {
      const adminSessionToken = issueAdminSessionToken({ role: user.role, userId: user.id });
      if (adminSessionToken) {
        res.json({ user: publicUser, adminSessionToken });
      } else {
        res.json({
          user: publicUser,
          adminSessionWarning:
            "Set ADMIN_SESSION_SECRET in server environment to protect admin APIs with this session token.",
        });
      }
      return;
    }
    res.json({ user: publicUser });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed." });
  }
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const col = usersCol();
    const list = await col
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    // Auto-backfill idCardNo for any existing student lacking one (format: YYYY-SECTOR-001)
    for (const u of list) {
      if (u.id !== "admin" && (!u.idCardNo || !u.idCardNo.trim())) {
        u.idCardNo = await generateIdCardNo(u.sector, u.createdAt ? new Date(u.createdAt).getFullYear() : undefined);
        await col.updateOne({ id: u.id }, { $set: { idCardNo: u.idCardNo } }).catch(() => {});
      }
    }

    // Sort newest first for display
    list.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

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
    const {
      email,
      password,
      name,
      phone,
      organization,
      sector,
      approved,
      idCardNo: providedIdCardNo,
      invoiceNo,
      registrationNo,
      coursePackage,
      admissionBatch,
      academicYear,
      admissionTakenBy,
      totalFees,
      paymentAmount,
      balanceFee,
    } = body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }
    const sectorVal = sector && VALID_SECTORS.includes(sector) ? sector : undefined;
    const col = usersCol();
    const emailNorm = normalizeEmail(email);
    const existing = await findUserByEmail(col, email);
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const idCardNo = providedIdCardNo?.trim() || (await generateIdCardNo(sectorVal));
    const finalTotalFees = totalFees !== undefined ? Number(totalFees) : 150000;
    const finalPayment = paymentAmount !== undefined ? Number(paymentAmount) : (approved ? 150000 : 0);
    const finalBalance = balanceFee !== undefined ? Number(balanceFee) : Math.max(0, finalTotalFees - finalPayment);

    const user: User = {
      id: generateId(),
      idCardNo,
      invoiceNo: invoiceNo?.trim() || String(Math.floor(5000 + Math.random() * 4000)),
      registrationNo: registrationNo?.trim() || String(Math.floor(5000 + Math.random() * 4000)),
      email: emailNorm,
      password: passwordHash,
      name: name.trim(),
      phone: phone?.trim(),
      organization: organization?.trim(),
      sector: sectorVal,
      coursePackage: coursePackage?.trim(),
      admissionBatch: admissionBatch?.trim() || "Mr Sooraj Jacob",
      academicYear: academicYear?.trim() || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      admissionTakenBy: admissionTakenBy?.trim() || "Dipali Kumari Agarwal",
      totalFees: finalTotalFees,
      paymentAmount: finalPayment,
      balanceFee: finalBalance,
      approved: approved === true,
      createdAt: new Date().toISOString(),
    };
    const doc = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined)) as User;
    try {
      await col.insertOne(doc as any);
    } catch (e) {
      if (isMongoDuplicateKeyError(e)) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }
      throw e;
    }
    if (user.approved) {
      notifyLearnerApproved({ name: user.name, email: user.email }).catch((err) =>
        console.error("[CREATE_USER] Notify learner approved failed:", err)
      );
    }
    res.status(201).json({ user: toPublic(user) });
  } catch (e) {
    if (isMongoDuplicateKeyError(e)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
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
      phone?: string;
      organization?: string;
      sector?: LearnerSector | "";
      approved?: boolean;
      idCardNo?: string;
      invoiceNo?: string;
      registrationNo?: string;
      coursePackage?: string;
      admissionBatch?: string;
      academicYear?: string;
      admissionTakenBy?: string;
      totalFees?: number;
      paymentAmount?: number;
      balanceFee?: number;
    };
    const email =
      body.email !== undefined ? normalizeEmail(body.email) : current.email;
    if (body.email !== undefined) {
      const duplicate = await col.findOne({
        id: { $ne: id },
        $expr: { $eq: [{ $toLower: "$email" }, email] },
      } as Record<string, unknown>);
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

    // If user doesn't have an idCardNo yet, generate one automatically
    const idCardNo =
      body.idCardNo !== undefined
        ? body.idCardNo.trim() || current.idCardNo
        : current.idCardNo ?? (await generateIdCardNo(sectorVal));

    const totalFees = body.totalFees !== undefined ? Number(body.totalFees) : current.totalFees;
    const paymentAmount = body.paymentAmount !== undefined ? Number(body.paymentAmount) : current.paymentAmount;
    let balanceFee = body.balanceFee !== undefined ? Number(body.balanceFee) : current.balanceFee;
    if (body.totalFees !== undefined || body.paymentAmount !== undefined) {
      if (body.balanceFee === undefined && totalFees !== undefined && paymentAmount !== undefined) {
        balanceFee = Math.max(0, totalFees - paymentAmount);
      }
    }

    const updates: Partial<User> = {
      name: body.name !== undefined ? body.name.trim() : current.name,
      email,
      phone: body.phone !== undefined ? body.phone.trim() : current.phone,
      organization: body.organization !== undefined ? body.organization.trim() : current.organization,
      sector: sectorVal,
      approved: body.approved !== undefined ? body.approved : current.approved,
      idCardNo,
      invoiceNo: body.invoiceNo !== undefined ? body.invoiceNo.trim() : current.invoiceNo,
      registrationNo: body.registrationNo !== undefined ? body.registrationNo.trim() : current.registrationNo,
      coursePackage: body.coursePackage !== undefined ? body.coursePackage.trim() : current.coursePackage,
      admissionBatch: body.admissionBatch !== undefined ? body.admissionBatch.trim() : current.admissionBatch,
      academicYear: body.academicYear !== undefined ? body.academicYear.trim() : current.academicYear,
      admissionTakenBy: body.admissionTakenBy !== undefined ? body.admissionTakenBy.trim() : current.admissionTakenBy,
      totalFees,
      paymentAmount,
      balanceFee,
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

export async function postSyncLearners(_req: Request, res: Response): Promise<void> {
  try {
    const col = usersCol();
    const receiptsCol = mongoCollection(MONGO_COLLECTIONS.receipts || "receipts");
    const users = await col.find({}).sort({ createdAt: 1 }).toArray();
    const receipts = await receiptsCol.find({}).toArray();

    const receiptByEmail = new Map();
    const receiptByIdCard = new Map();
    const receiptByName = new Map();
    receipts.forEach((r: any) => {
      if (r.payerEmail) receiptByEmail.set(r.payerEmail.toLowerCase().trim(), r);
      if (r.idCardNo) receiptByIdCard.set(r.idCardNo.trim(), r);
      if (r.receivedFrom) receiptByName.set(r.receivedFrom.toLowerCase().trim(), r);
    });

    const sectorCounters: Record<string, number> = {};
    let updatedCount = 0;

    for (const u of users) {
      if (u.id === "admin") continue;

      const year = u.createdAt ? new Date(u.createdAt).getFullYear() : 2026;
      const secCode = getSectorCode(u.sector);
      const counterKey = `${year}-${secCode}`;
      sectorCounters[counterKey] = (sectorCounters[counterKey] || 0) + 1;
      const seq = sectorCounters[counterKey];
      const newStudentId = `${year}-${secCode}-${String(seq).padStart(3, "0")}`;

      const r = (u.email && receiptByEmail.get(u.email.toLowerCase().trim())) ||
                (u.idCardNo && receiptByIdCard.get(u.idCardNo.trim())) ||
                (u.name && receiptByName.get(u.name.toLowerCase().trim()));

      const invNo = u.invoiceNo || (r ? r.invoiceId : `${5000 + seq}`);
      const regNo = u.registrationNo || (r ? r.invoiceId : `${5000 + seq}`);
      const totalFees = u.totalFees !== undefined ? u.totalFees : (r ? (r.dueFee || r.receivedFee || 150000) : 150000);
      const payment = u.paymentAmount !== undefined ? u.paymentAmount : (r ? r.receivedFee : (u.approved ? 150000 : 0));
      const balance = u.balanceFee !== undefined ? u.balanceFee : Math.max(0, totalFees - payment);
      const academicYear = u.academicYear || `${year}-${year + 1}`;
      const admissionBatch = u.admissionBatch || (u.sector === "mining" ? "Mr Rahul Aren" : "Mr Sooraj Jacob");
      const admissionTakenBy = u.admissionTakenBy || (seq % 2 === 0 ? "SUBHASH KUMAR" : "Dipali Kumari Agarwal");

      const updateFields: any = {
        idCardNo: newStudentId,
        invoiceNo: invNo,
        registrationNo: regNo,
        totalFees,
        paymentAmount: payment,
        balanceFee: balance,
        academicYear,
        admissionBatch,
        admissionTakenBy,
      };

      if (!u.phone && r?.payerPhone) {
        updateFields.phone = r.payerPhone;
      }

      await col.updateOne({ id: u.id }, { $set: updateFields });
      if (u.idCardNo && u.idCardNo !== newStudentId) {
        await receiptsCol.updateMany({ idCardNo: u.idCardNo }, { $set: { idCardNo: newStudentId } });
      }
      updatedCount++;
    }

    res.json({ success: true, count: updatedCount });
  } catch (e) {
    console.error("Sync learners error:", e);
    res.status(500).json({ error: "Failed to sync learners." });
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
    const user = await findUserByEmail(usersCol(), email);

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

    const user = await findUserByEmail(usersCol(), reset.email);
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