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
  let safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
  let ext = path.extname(safeName).toLowerCase();
  if (!isAllowedUploadExtension(ext)) {
    throw new Error(`File type ${ext} is not allowed.`);
  }
  let buf = Buffer.from(contentBase64, "base64");
  if (buf.length > 10 * 1024 * 1024) { // Max 10MB as per screenshot
    throw new Error(`File ${filename} is too large (max 10MB).`);
  }

  const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp", ".tif", ".tiff", ".heic"]);

  if (IMAGE_EXTS.has(ext)) {
    try {
      const sharp = (await import("sharp")).default;
      buf = Buffer.from(await sharp(buf).webp({ quality: 80 }).toBuffer());
      ext = ".webp";
      safeName = `${path.parse(safeName).name}.webp`;
      contentBase64 = buf.toString("base64");
    } catch (err) {
      console.warn(`Failed to convert image ${filename} to webp:`, err);
      // Fallback to original buffer and extension if conversion fails
    }
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

    try {
      const { sendAdminEmail } = await import("../lib/notify.ts");
      const adminSubject = `[KSOSHTC] New Training Registration - ${names}`;
      const adminHtml = `
        <h2>New Training Registration</h2>
        <p><strong>Names:</strong> ${names}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Courses:</strong> ${courses.join(", ")}</p>
        ${registrationFeeReceiptUrl ? `<p><strong>Registration Fee Receipt:</strong> <a href="${registrationFeeReceiptUrl}">View Receipt</a></p>` : ""}
        ${tuitionFeeReceiptUrl ? `<p><strong>Tuition Fee Receipt:</strong> <a href="${tuitionFeeReceiptUrl}">View Receipt</a></p>` : ""}
        ${highestDegreeUrls.length > 0 ? `<p><strong>Highest Degrees:</strong><br>${highestDegreeUrls.map(u => `<a href="${u}">View Document</a>`).join("<br>")}</p>` : ""}
      `;
      const adminText = `New Training Registration\n\nNames: ${names}\nEmail: ${email}\nPhone: ${phone}\nCourses: ${courses.join(", ")}\n`;
      await sendAdminEmail(adminSubject, adminText, adminHtml);
    } catch (err) {
      console.error("Failed to send admin email for registration:", err);
    }

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
