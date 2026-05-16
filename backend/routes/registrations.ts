import { Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { RegistrationSubmissionDoc } from "../../shared/api";
import { isAdminSessionAuthorized } from "../lib/adminSession";
import { isAllowedUploadExtension, mimeFromExtension } from "../../shared/allowedUploads.ts";

function registrationsCol() {
  return mongoCollection<RegistrationSubmissionDoc>(MONGO_COLLECTIONS.registrations);
}

async function uploadBase64File(filename: string, contentBase64: string, folder: string): Promise<string> {
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
  const ext = path.extname(safeName).toLowerCase();
  if (!isAllowedUploadExtension(ext)) {
    throw new Error(`File type ${ext} is not allowed.`);
  }
  const buf = Buffer.from(contentBase64, "base64");
  if (buf.length > 10 * 1024 * 1024) { // Max 10MB as per screenshot
    throw new Error(`File ${filename} is too large (max 10MB).`);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const mime = mimeFromExtension(ext);
  const publicId = `${crypto.randomUUID()}_${path.parse(safeName).name}${ext}`;
  const uri = `data:${mime};base64,${contentBase64}`;
  
  const result = await cloudinary.uploader.upload(uri, {
    folder,
    public_id: publicId,
    resource_type: "raw",
  });
  
  return result.secure_url;
}

export async function postRegistration(req: Request, res: Response): Promise<void> {
  try {
    const { names, email, phone, courses, registrationFeeReceipt, tuitionFeeReceipt, highestDegrees } = req.body;

    if (!names || !email || !phone || !courses || courses.length === 0) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    let registrationFeeReceiptUrl: string | undefined;
    if (registrationFeeReceipt) {
      registrationFeeReceiptUrl = await uploadBase64File(
        registrationFeeReceipt.filename,
        registrationFeeReceipt.contentBase64,
        "ksohtc/registrations"
      );
    }

    let tuitionFeeReceiptUrl: string | undefined;
    if (tuitionFeeReceipt) {
      tuitionFeeReceiptUrl = await uploadBase64File(
        tuitionFeeReceipt.filename,
        tuitionFeeReceipt.contentBase64,
        "ksohtc/registrations"
      );
    }

    const highestDegreeUrls: string[] = [];
    if (Array.isArray(highestDegrees)) {
      for (const degree of highestDegrees) {
        if (degree.filename && degree.contentBase64) {
          const url = await uploadBase64File(
            degree.filename,
            degree.contentBase64,
            "ksohtc/registrations"
          );
          highestDegreeUrls.push(url);
        }
      }
    }

    const doc: RegistrationSubmissionDoc = {
      id: crypto.randomUUID(),
      names,
      email,
      phone,
      courses,
      registrationFeeReceiptUrl,
      tuitionFeeReceiptUrl,
      highestDegreeUrls: highestDegreeUrls.length > 0 ? highestDegreeUrls : undefined,
      submittedAt: new Date().toISOString(),
    };

    await registrationsCol().insertOne(doc as any);

    res.status(201).json({ message: "Registration successful", registration: doc });
  } catch (e) {
    console.error("postRegistration error:", e);
    const msg = e instanceof Error ? e.message : "Failed to submit registration.";
    res.status(500).json({ error: msg });
  }
}

export async function getRegistrations(req: Request, res: Response): Promise<void> {
  try {
    if (!isAdminSessionAuthorized(req)) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const list = await registrationsCol().find({}).toArray();
    res.json({ registrations: list });
  } catch (e) {
    console.error("getRegistrations error:", e);
    res.status(500).json({ error: "Failed to fetch registrations." });
  }
}
