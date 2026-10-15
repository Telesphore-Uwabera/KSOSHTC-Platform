import { Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { TeamMember, TeamMemberCreate, TeamMemberUpdate } from "@shared/api";

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "team-1",
    name: "Emmanuel NIYOBUHUNGIRO",
    role: "Managing Director & HSE Specialist",
    bio: "Over 4 years of experience in Occupational Health, Safety, Emergency, and Disaster Management. Lead accredited trainer.",
    avatarUrl: "/about-emmanuel-2.webp",
    order: 1,
    active: true,
    email: "info@ksoshtc.org",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team-2",
    name: "Jacques Roger NIYONTEZE",
    role: "HSSE Professional & Lead Auditor",
    bio: "Over 7 years of experience in energy, infrastructure, mining and industrial safety. Specialist in risk assessment and ISO 45001.",
    avatarUrl: "/ksohtc-8.webp",
    order: 2,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "team-3",
    name: "Marie Claire UWINGABIRE",
    role: "Head of Training & Curriculum",
    bio: "Expert in occupational safety pedagogies, TVET regulatory compliance, and practical workplace safety implementations.",
    avatarUrl: "/ksohtc-7.webp",
    order: 3,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "team-4",
    name: "Aimable MUGISHA",
    role: "Industrial & Mining Safety Lead",
    bio: "Specialist in industrial ergonomics, hazardous materials management, and heavy industry compliance.",
    avatarUrl: "/ksohtc-9.webp",
    order: 4,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

let inMemoryTeam: TeamMember[] = [...DEFAULT_TEAM_MEMBERS];

function teamCol() {
  return mongoCollection<TeamMember>(MONGO_COLLECTIONS.team_members);
}

async function processAndUploadAvatar(
  filename: string,
  contentBase64: string,
  folder = "ksohtc/team"
): Promise<string> {
  const cleanBase64 = contentBase64.replace(/^data:image\/[a-z0-9.+_-]+;base64,/i, "");
  let buf = Buffer.from(cleanBase64, "base64");

  if (buf.length > 10 * 1024 * 1024) {
    throw new Error("Avatar image is too large (maximum 10MB).");
  }

  try {
    const sharp = (await import("sharp")).default;
    buf = Buffer.from(
      await sharp(buf)
        .resize(600, 600, {
          fit: "cover",
          position: "center",
          withoutEnlargement: false,
        })
        .webp({ quality: 85 })
        .toBuffer()
    );
  } catch (err) {
    console.warn("[TEAM] Failed to convert avatar to webp via sharp:", err);
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return `data:image/webp;base64,${buf.toString("base64")}`;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const baseName = path.parse(filename || "member").name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const publicId = `${crypto.randomUUID()}_${baseName}.webp`;
  const uri = `data:image/webp;base64,${buf.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(uri, {
    folder,
    public_id: publicId,
    resource_type: "image",
    format: "webp",
  });

  return uploadResult.secure_url;
}

/** Public endpoint: Returns active team members ordered for display (About Us slider) */
export async function getPublicTeamMembers(req: Request, res: Response): Promise<void> {
  try {
    const col = teamCol();
    const docs = await col.find({ active: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray();
    if (docs.length > 0) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      res.json(docs);
      return;
    }
    // If DB is empty, seed initial defaults
    res.json(inMemoryTeam.filter((m) => m.active));
  } catch (e) {
    console.warn("[TEAM] Mongo fetch failed, returning in-memory:", e);
    res.json(inMemoryTeam.filter((m) => m.active));
  }
}

/** Admin endpoint: Returns all team members */
export async function getAllTeamMembers(req: Request, res: Response): Promise<void> {
  try {
    const col = teamCol();
    const docs = await col.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    if (docs.length > 0) {
      res.json(docs);
      return;
    }
    res.json(inMemoryTeam);
  } catch (e) {
    console.warn("[TEAM] Mongo fetch failed, returning in-memory:", e);
    res.json(inMemoryTeam);
  }
}

export async function createTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const body: TeamMemberCreate = req.body;
    if (!body.name || !body.role) {
      res.status(400).json({ error: "Name and Role are required." });
      return;
    }

    let avatarUrl = body.avatarUrl || "";
    if (body.avatarFile?.contentBase64) {
      try {
        avatarUrl = await processAndUploadAvatar(
          body.avatarFile.filename,
          body.avatarFile.contentBase64
        );
      } catch (uploadErr) {
        console.error("[TEAM] Avatar upload error:", uploadErr);
        res.status(400).json({ error: "Failed to process avatar image." });
        return;
      }
    }

    const now = new Date().toISOString();
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      role: body.role.trim(),
      bio: body.bio?.trim() || "",
      avatarUrl: avatarUrl || "/logo_transparent.webp",
      email: body.email?.trim() || "",
      phone: body.phone?.trim() || "",
      linkedinUrl: body.linkedinUrl?.trim() || "",
      order: Number(body.order) || inMemoryTeam.length + 1,
      active: body.active !== false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const col = teamCol();
      await col.insertOne(newMember as any);
    } catch (dbErr) {
      console.warn("[TEAM] Mongo insert failed, stored in memory:", dbErr);
    }

    inMemoryTeam.push(newMember);
    res.status(201).json(newMember);
  } catch (e) {
    console.error("[TEAM] Error creating team member:", e);
    res.status(500).json({ error: "Failed to create team member" });
  }
}

export async function updateTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body: TeamMemberUpdate = req.body;

    let avatarUrl = body.avatarUrl;
    if (body.avatarFile?.contentBase64) {
      try {
        avatarUrl = await processAndUploadAvatar(
          body.avatarFile.filename,
          body.avatarFile.contentBase64
        );
      } catch (uploadErr) {
        console.error("[TEAM] Avatar upload error:", uploadErr);
        res.status(400).json({ error: "Failed to process avatar image." });
        return;
      }
    }

    const now = new Date().toISOString();
    const updateData: Partial<TeamMember> = {
      ...body,
      updatedAt: now,
    };
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    delete (updateData as any).avatarFile;

    try {
      const col = teamCol();
      await col.updateOne({ id }, { $set: updateData });
    } catch (dbErr) {
      console.warn("[TEAM] Mongo update failed:", dbErr);
    }

    const idx = inMemoryTeam.findIndex((m) => m.id === id);
    if (idx !== -1) {
      inMemoryTeam[idx] = { ...inMemoryTeam[idx], ...updateData };
    }

    res.json({ message: "Team member updated successfully" });
  } catch (e) {
    console.error("[TEAM] Error updating team member:", e);
    res.status(500).json({ error: "Failed to update team member" });
  }
}

export async function deleteTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    try {
      const col = teamCol();
      await col.deleteOne({ id });
    } catch (dbErr) {
      console.warn("[TEAM] Mongo delete failed:", dbErr);
    }

    inMemoryTeam = inMemoryTeam.filter((m) => m.id !== id);
    res.json({ message: "Team member deleted successfully" });
  } catch (e) {
    console.error("[TEAM] Error deleting team member:", e);
    res.status(500).json({ error: "Failed to delete team member" });
  }
}
