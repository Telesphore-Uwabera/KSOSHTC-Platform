import { Request, Response } from "express";
import crypto from "node:crypto";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { notifyLearnerCertificateIssued } from "../lib/notify";

export interface Certificate {
  id: string;
  title: string;
  learnerName: string;
  courses: string;
  dateIssued: string;
  duration: string;
  certificateId: string;
  email: string;
  createdAt: string;
}

export async function createCertificate(req: Request, res: Response): Promise<void> {
  try {
    const { title, learnerName, courses, dateIssued, duration, email } = req.body;
    
    if (!learnerName || !courses || !dateIssued) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    
    // Generate a unique certificate ID if not provided
    // Pattern: Year-KS-Counter
    const year = new Date(dateIssued).getFullYear();
    const count = await col.countDocuments({ dateIssued: { $regex: `^${year}` } });
    const certificateId = `${year}-KS-${String(count + 1).padStart(5, '0')}`;

    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      title: title || "Mr.",
      learnerName,
      courses,
      dateIssued,
      duration: duration || "3 months",
      email: email || "ksoshtc@gmail.com",
      certificateId,
      createdAt: new Date().toISOString(),
    };

    await col.insertOne(newCertificate as any);
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

    res.json(cert);
  } catch (e) {
    console.error("Get certificate error:", e);
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
}

export async function getAllCertificates(req: Request, res: Response): Promise<void> {
  try {
    const col = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const certs = await col.find({}).sort({ createdAt: -1 }).toArray();
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
