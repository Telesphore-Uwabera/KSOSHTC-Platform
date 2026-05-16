import { Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { SubscriberDoc } from "../../shared/api";
import { isAdminSessionAuthorized } from "../lib/adminSession";
import { sendEmail } from "../lib/notify";
import { isAllowedUploadExtension, mimeFromExtension } from "../../shared/allowedUploads.ts";

function subscribersCol() {
  return mongoCollection<SubscriberDoc>(MONGO_COLLECTIONS.subscribers);
}

async function uploadBase64File(filename: string, contentBase64: string, folder: string): Promise<string> {
  let safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-\s+()]/g, "_");
  let ext = path.extname(safeName).toLowerCase();
  if (!isAllowedUploadExtension(ext)) {
    throw new Error(`File type ${ext} is not allowed.`);
  }
  let buf = Buffer.from(contentBase64, "base64");
  if (buf.length > 10 * 1024 * 1024) { // Max 10MB
    throw new Error(`File ${filename} is too large (max 10MB).`);
  }

  const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp", ".tif", ".tiff", ".heic"]);

  if (IMAGE_EXTS.has(ext)) {
    try {
      const sharp = (await import("sharp")).default;
      buf = await sharp(buf).webp({ quality: 80 }).toBuffer();
      ext = ".webp";
      safeName = `${path.parse(safeName).name}.webp`;
      contentBase64 = buf.toString("base64");
    } catch (err) {
      console.warn(`Failed to convert image ${filename} to webp:`, err);
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

export async function postCommunicationSend(req: Request, res: Response): Promise<void> {
  try {
    if (!isAdminSessionAuthorized(req)) {
      res.status(403).json({ error: "Admin only" });
      return;
    }

    const { subject, message, files } = req.body;

    if (!subject || !message) {
      res.status(400).json({ error: "Subject and message are required." });
      return;
    }

    const subscribers = await subscribersCol().find({}).toArray();
    if (subscribers.length === 0) {
      res.status(400).json({ error: "No subscribers found." });
      return;
    }

    let appendedHtml = "";
    let appendedText = "";

    if (Array.isArray(files) && files.length > 0) {
      appendedHtml += "<br><hr><p><strong>Attachments / Media:</strong></p>";
      appendedText += "\n\n---\nAttachments / Media:\n";
      
      for (const file of files) {
        if (file.filename && file.contentBase64) {
          const url = await uploadBase64File(file.filename, file.contentBase64, "ksohtc/communications");
          const ext = path.extname(url).toLowerCase();
          const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"]);
          
          if (IMAGE_EXTS.has(ext)) {
            appendedHtml += `<p><img src="${url}" alt="${file.filename}" style="max-width: 100%; height: auto;" /></p>`;
            appendedText += `Image: ${url}\n`;
          } else {
            appendedHtml += `<p><a href="${url}" target="_blank">Download ${file.filename}</a></p>`;
            appendedText += `File (${file.filename}): ${url}\n`;
          }
        }
      }
    }

    const finalHtml = `<div style="font-family: sans-serif; white-space: pre-wrap;">${message}</div>${appendedHtml}`;
    const finalText = `${message}${appendedText}`;

    // Send emails individually to avoid exposing other subscribers' emails
    for (const sub of subscribers) {
      await sendEmail(sub.email, subject, finalText, finalHtml);
    }

    res.status(200).json({ message: `Successfully sent to ${subscribers.length} subscribers.` });
  } catch (e) {
    console.error("postCommunicationSend error:", e);
    const msg = e instanceof Error ? e.message : "Failed to send communication.";
    res.status(500).json({ error: msg });
  }
}
