import { RequestHandler } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { Testimonial, TestimonialCreate, TestimonialUpdate } from "@shared/api";

const TESTIMONIALS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let testimonialsCache: { fetchedAt: number; data: Testimonial[] } | null = null;

function testimonialsCol() {
  return mongoCollection<Testimonial>(MONGO_COLLECTIONS.testimonials);
}

/**
 * Process an avatar image: converts to WebP using sharp, then uploads to Cloudinary.
 * Returns the secure Cloudinary WebP image URL.
 */
async function processAndUploadAvatar(
  filename: string,
  contentBase64: string,
  folder = "ksohtc/testimonials"
): Promise<string> {
  const cleanBase64 = contentBase64.replace(/^data:image\/[a-z0-9.+_-]+;base64,/i, "");
  let buf = Buffer.from(cleanBase64, "base64");

  if (buf.length > 10 * 1024 * 1024) {
    throw new Error("Avatar image is too large (maximum 10MB).");
  }

  // Convert to WebP using sharp with avatar-friendly dimensions
  let ext = ".webp";
  try {
    const sharp = (await import("sharp")).default;
    buf = Buffer.from(
      await sharp(buf)
        .resize(500, 500, {
          fit: "cover",
          position: "center",
          withoutEnlargement: false,
        })
        .webp({ quality: 85 })
        .toBuffer()
    );
  } catch (err) {
    console.warn("[TESTIMONIALS] Failed to convert avatar to webp via sharp:", err);
    // Continue with original buffer if sharp fails
  }

  // Ensure Cloudinary is configured
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.warn("[TESTIMONIALS] Cloudinary credentials missing. Storing as base64 data URI fallback.");
    return `data:image/webp;base64,${buf.toString("base64")}`;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const baseName = path.parse(filename || "avatar").name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const publicId = `${crypto.randomUUID()}_${baseName}${ext}`;
  const uri = `data:image/webp;base64,${buf.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(uri, {
    folder,
    public_id: publicId,
    resource_type: "image",
    format: "webp",
  });

  return uploadResult.secure_url;
}

export const getTestimonials: RequestHandler = async (_req, res) => {
  try {
    if (testimonialsCache && Date.now() - testimonialsCache.fetchedAt < TESTIMONIALS_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
      res.json(testimonialsCache.data);
      return;
    }
    const col = testimonialsCol();
    const list = await col.find({}).sort({ createdAt: -1 }).toArray();
    // Normalize and remove Mongo _id
    const formatted = list.map((item) => {
      const { _id, ...rest } = item as any;
      return rest as Testimonial;
    });
    testimonialsCache = { fetchedAt: Date.now(), data: formatted };
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
    res.json(formatted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Get testimonials error:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to load testimonials" });
  }
};

export const postTestimonial: RequestHandler = async (req, res) => {
  try {
    const body = req.body as Partial<TestimonialCreate>;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const role = typeof body?.role === "string" ? body.role.trim() : "";
    const quote = typeof body?.quote === "string" ? body.quote.trim() : "";

    if (!name || !quote) {
      res.status(400).json({ error: "Name and quote are required" });
      return;
    }

    let avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl.trim() : undefined;

    // Handle avatar image file upload if supplied (converts to WebP and uploads to Cloudinary)
    if (body?.avatarFile && body.avatarFile.contentBase64) {
      try {
        avatarUrl = await processAndUploadAvatar(
          body.avatarFile.filename || `${name.toLowerCase().replace(/\s+/g, "_")}.jpg`,
          body.avatarFile.contentBase64
        );
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        res.status(400).json({ error: `Avatar upload failed: ${msg}` });
        return;
      }
    } else if (avatarUrl && avatarUrl.startsWith("data:image/")) {
      // If a data URI was passed directly in avatarUrl
      try {
        avatarUrl = await processAndUploadAvatar(
          `${name.toLowerCase().replace(/\s+/g, "_")}.webp`,
          avatarUrl
        );
      } catch (uploadErr) {
        console.warn("Base64 avatar processing fallback:", uploadErr);
      }
    }

    const now = new Date().toISOString();
    const testimonial: Testimonial = {
      id: crypto.randomUUID(),
      name,
      role: role || "Participant",
      quote,
      avatarUrl: avatarUrl || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const col = testimonialsCol();
    await col.insertOne(testimonial as any);
    testimonialsCache = null;

    res.status(201).json(testimonial);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Post testimonial error:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to add testimonial" });
  }
};

export const putTestimonial: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Testimonial ID is required" });
      return;
    }

    const col = testimonialsCol();
    const existing = await col.findOne({ id } as any);
    if (!existing) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    const body = req.body as TestimonialUpdate;
    const updates: Partial<Testimonial> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof body.name === "string") {
      const trimmed = body.name.trim();
      if (!trimmed) {
        res.status(400).json({ error: "Name cannot be empty" });
        return;
      }
      updates.name = trimmed;
    }

    if (typeof body.role === "string") {
      updates.role = body.role.trim() || "Participant";
    }

    if (typeof body.quote === "string") {
      const trimmed = body.quote.trim();
      if (!trimmed) {
        res.status(400).json({ error: "Quote cannot be empty" });
        return;
      }
      updates.quote = trimmed;
    }

    // Check if new avatar file is provided for upload
    if (body.avatarFile && body.avatarFile.contentBase64) {
      try {
        const nameForFile = updates.name || existing.name;
        updates.avatarUrl = await processAndUploadAvatar(
          body.avatarFile.filename || `${nameForFile.toLowerCase().replace(/\s+/g, "_")}.jpg`,
          body.avatarFile.contentBase64
        );
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        res.status(400).json({ error: `Avatar upload failed: ${msg}` });
        return;
      }
    } else if (body.avatarUrl !== undefined) {
      // Allows updating or clearing avatarUrl directly
      if (body.avatarUrl && body.avatarUrl.startsWith("data:image/")) {
        try {
          const nameForFile = updates.name || existing.name;
          updates.avatarUrl = await processAndUploadAvatar(
            `${nameForFile.toLowerCase().replace(/\s+/g, "_")}.webp`,
            body.avatarUrl
          );
        } catch (uploadErr) {
          console.warn("Base64 avatar processing fallback:", uploadErr);
          updates.avatarUrl = body.avatarUrl;
        }
      } else {
        updates.avatarUrl = body.avatarUrl.trim() || undefined;
      }
    }

    await col.updateOne({ id } as any, { $set: updates });
    testimonialsCache = null;

    const updated = await col.findOne({ id } as any);
    const { _id, ...rest } = (updated || {}) as any;
    res.json(rest);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Put testimonial error:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to update testimonial" });
  }
};

export const deleteTestimonial: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Testimonial ID is required" });
      return;
    }

    const col = testimonialsCol();
    const result = await col.deleteOne({ id } as any);
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    testimonialsCache = null;
    res.json({ ok: true, message: "Testimonial deleted successfully", id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Delete testimonial error:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
};
