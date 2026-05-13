import { Request, Response } from "express";
import crypto from "node:crypto";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { notifyLearnerCertificateIssued } from "../lib/notify";

export interface TranscriptItem {
  title: string;
  score: number;
  date: string;
  hours: number;
  note?: string;
}

export interface Certificate {
  id: string;
  type?: 'general' | 'first-aid' | 'lifting-safety' | 'height-safety';
  title: string;
  learnerName: string;
  courses: string;
  dateIssued: string;
  duration: string;
  certificateId: string;
  email: string;
  createdAt: string;
  startDate?: string;
  completionDate?: string;
  // Transcript Extensions
  totalHours?: number;
  averageScore?: number;
  gpa?: string;
  transcript?: TranscriptItem[];
}

const CERTIFICATES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let certificatesCache: { fetchedAt: number; data: Certificate[] } | null = null;

async function getNextCertificateId(year: number): Promise<string> {
  const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
  const pattern = `${year}-KS-`;
  
  // Find the certificate with the highest sequence number for this year
  const lastCert = await col.find({ 
    certificateId: { $regex: `^${pattern}` } 
  })
  .sort({ certificateId: -1 })
  .limit(1)
  .toArray();

  let nextNumber = 1;
  if (lastCert.length > 0) {
    const lastId = lastCert[0].certificateId;
    const lastNumberStr = lastId.split('-').pop();
    if (lastNumberStr) {
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }
  }

  return `${pattern}${String(nextNumber).padStart(5, '0')}`;
}

export async function createCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { type, title, learnerName, courses, dateIssued, duration, email, totalHours, averageScore, gpa, transcript, startDate, completionDate } = req.body;
    
    if (!learnerName || !courses || !dateIssued) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const year = new Date(dateIssued).getFullYear();
    const certificateId = await getNextCertificateId(year);

    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      type: type || 'general',
      title: title || "Mr.",
      learnerName,
      courses,
      dateIssued,
      duration: duration || "3 months",
      email: email || "ksoshtc@gmail.com",
      certificateId,
      createdAt: new Date().toISOString(),
      totalHours,
      averageScore,
      gpa,
      transcript,
      startDate,
      completionDate,
    };

    await col.insertOne(newCertificate as any);
    certificatesCache = null; // Invalidate cache on new certificate
    res.json(newCertificate);
  } catch (e) {
    console.error("Create certificate error:", e);
    res.status(500).json({ error: "Failed to create certificate" });
  }
}

export async function getCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const cert = await col.findOne({ $or: [{ id }, { certificateId: id }] });

    if (!cert) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    res.setHeader("Cache-Control", "private, max-age=300"); // Cache individual certs for 5 mins
    res.json(cert);
  } catch (e) {
    console.error("Get certificate error:", e);
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
}

export async function getAllCertificates(req: Request, res: Response): Promise<void> {
  try {
    if (certificatesCache && Date.now() - certificatesCache.fetchedAt < CERTIFICATES_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
      res.json(certificatesCache.data);
      return;
    }

    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const certs = await col.find({}).sort({ createdAt: -1 }).toArray();
    
    certificatesCache = { fetchedAt: Date.now(), data: certs };
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
    res.json(certs);
  } catch (e) {
    console.error("Get all certificates error:", e);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
}

export async function updateCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const update = req.body;
    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    
    const result = await col.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    certificatesCache = null; // Invalidate cache on update
    res.json(result);
  } catch (e) {
    console.error("Update certificate error:", e);
    res.status(500).json({ error: "Failed to update certificate" });
  }
}

export async function deleteCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    
    const result = await col.deleteOne({ id });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    certificatesCache = null; // Invalidate cache on delete
    res.json({ message: "Certificate deleted successfully" });
  } catch (e) {
    console.error("Delete certificate error:", e);
    res.status(500).json({ error: "Failed to delete certificate" });
  }
}

export async function sendEmailCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const cert = await col.findOne({ id });

    if (!cert) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    if (!cert.email || !cert.email.includes("@")) {
      res.status(400).json({ error: "Learner does not have a valid email address recorded." });
      return;
    }

    await notifyLearnerCertificateIssued({
      name: cert.learnerName,
      email: cert.email,
      courseTitle: cert.courses,
      certificateId: cert.certificateId,
    });

    res.json({ message: `Congratulatory email sent to ${cert.email}` });
  } catch (e) {
    console.error("Email certificate error:", e);
    res.status(500).json({ error: "Failed to send email" });
  }
}

export async function getNextId(req: Request, res: Response): Promise<void> {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const nextId = await getNextCertificateId(year);
    res.json({ nextId });
  } catch (e) {
    console.error("Get next ID error:", e);
    res.status(500).json({ error: "Failed to fetch next ID" });
  }
}
