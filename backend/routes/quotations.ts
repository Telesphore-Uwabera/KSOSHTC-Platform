import { Request, Response } from "express";
import crypto from "node:crypto";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import {
  type Quotation,
  type QuotationModule,
  type QuotationTrainer,
  FIXED_PAYMENT_INFO,
  FIXED_MOTTO,
} from "@shared/api";

// In-memory fallback if Mongo is disconnected or for seamless dev
let inMemoryQuotations: Quotation[] = [];

async function getNextQuotationNo(): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const prefix = `KSOSHTC/${month}${year}/FA-`;

  try {
    const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
    const lastDocs = await col.find({ quotationNo: { $regex: `^${prefix}` } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    let nextSeq = 1;
    if (lastDocs.length > 0 && lastDocs[0].quotationNo) {
      const parts = lastDocs[0].quotationNo.split("FA-");
      if (parts.length > 1) {
        const parsed = parseInt(parts[1], 10);
        if (!isNaN(parsed)) {
          nextSeq = parsed + 1;
        }
      }
    }
    const seqStr = String(nextSeq).padStart(3, '0');
    return `${prefix}AWR${seqStr}`;
  } catch {
    const nextSeq = inMemoryQuotations.length + 1;
    const seqStr = String(nextSeq).padStart(3, '0');
    return `${prefix}AWR${seqStr}`;
  }
}

export async function getQuotations(req: Request, res: Response): Promise<void> {
  try {
    const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
    const list = await col.find({}).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (e) {
    console.warn("[QUOTATIONS] Failed to fetch from Mongo, using in-memory store:", e);
    res.json(inMemoryQuotations.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  }
}

export async function getQuotationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    try {
      const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
      const doc = await col.findOne({ id });
      if (doc) {
        res.json(doc);
        return;
      }
    } catch {}

    const mem = inMemoryQuotations.find((q) => q.id === id);
    if (!mem) {
      res.status(404).json({ error: "Quotation not found" });
      return;
    }
    res.json(mem);
  } catch (e) {
    console.error("Get quotation by ID error:", e);
    res.status(500).json({ error: "Failed to fetch quotation" });
  }
}

export async function createQuotation(req: Request, res: Response): Promise<void> {
  try {
    const {
      quotationNo,
      date,
      clientName,
      clientTin,
      trainingTitle,
      location,
      numberOfParticipants,
      costPerPerson,
      duration,
      modules,
      trainingMethodology,
      includedInFee,
      paymentTerms,
      additionalInfo,
      trainers,
      preparedBy,
    } = req.body;

    if (!clientName || !location) {
      res.status(400).json({ error: "Client name and location are required." });
      return;
    }

    const participants = Number(numberOfParticipants) || 1;
    const cost = Number(costPerPerson) || 0;
    const computedTotalCost = participants * cost;

    const generatedNo = quotationNo || (await getNextQuotationNo());
    const currentDateStr = date || new Date().toLocaleDateString("en-GB");

    const newQuotation: Quotation = {
      id: crypto.randomUUID(),
      quotationNo: generatedNo,
      date: currentDateStr,
      clientName,
      clientTin: clientTin ? String(clientTin).trim() : undefined,
      trainingTitle: trainingTitle ? String(trainingTitle).trim() : "Occupational Safety and Health (OSH) Training",
      location,
      numberOfParticipants: participants,
      costPerPerson: cost,
      totalCost: computedTotalCost,
      duration: duration || "5 Days",
      paymentInfo: FIXED_PAYMENT_INFO,
      modules: Array.isArray(modules) ? modules : [],
      trainingMethodology: Array.isArray(trainingMethodology) ? trainingMethodology : [],
      includedInFee: Array.isArray(includedInFee) ? includedInFee : [],
      paymentTerms: Array.isArray(paymentTerms) ? paymentTerms : [],
      additionalInfo: Array.isArray(additionalInfo) ? additionalInfo : [],
      trainers: Array.isArray(trainers) ? trainers : [],
      preparedBy: preparedBy || {
        name: "Jackson DUSABIMANA",
        title: "Director - KSOSHTC",
      },
      motto: FIXED_MOTTO,
      createdAt: new Date().toISOString(),
    };

    inMemoryQuotations.unshift(newQuotation);

    try {
      const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
      await col.insertOne(newQuotation as any);
      console.log(`[QUOTATIONS] Quotation ${newQuotation.quotationNo} successfully saved to MongoDB database.`);
    } catch (dbErr) {
      console.warn("[QUOTATIONS] Mongo save warning, saved in-memory fallback:", dbErr);
    }

    res.json(newQuotation);
  } catch (e) {
    console.error("Create quotation error:", e);
    res.status(500).json({ error: "Failed to create quotation" });
  }
}

export async function updateQuotation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      quotationNo,
      date,
      clientName,
      clientTin,
      trainingTitle,
      location,
      numberOfParticipants,
      costPerPerson,
      duration,
      modules,
      trainingMethodology,
      includedInFee,
      paymentTerms,
      additionalInfo,
      trainers,
      preparedBy,
    } = req.body;

    let existing: Quotation | null = null;
    try {
      const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
      existing = await col.findOne({ id });
    } catch {}

    if (!existing) {
      existing = inMemoryQuotations.find((q) => q.id === id) || null;
    }

    if (!existing) {
      res.status(404).json({ error: "Quotation not found" });
      return;
    }

    const participants = Number(numberOfParticipants) ?? existing.numberOfParticipants;
    const cost = Number(costPerPerson) ?? existing.costPerPerson;
    const computedTotalCost = participants * cost;

    const updatedDoc: Quotation = {
      ...existing,
      quotationNo: quotationNo || existing.quotationNo,
      date: date || existing.date,
      clientName: clientName || existing.clientName,
      clientTin: clientTin !== undefined ? String(clientTin).trim() : existing.clientTin,
      trainingTitle: trainingTitle !== undefined ? String(trainingTitle).trim() : existing.trainingTitle,
      location: location || existing.location,
      numberOfParticipants: participants,
      costPerPerson: cost,
      totalCost: computedTotalCost,
      duration: duration || existing.duration,
      paymentInfo: FIXED_PAYMENT_INFO,
      modules: Array.isArray(modules) ? modules : existing.modules,
      trainingMethodology: Array.isArray(trainingMethodology) ? trainingMethodology : existing.trainingMethodology,
      includedInFee: Array.isArray(includedInFee) ? includedInFee : existing.includedInFee,
      paymentTerms: Array.isArray(paymentTerms) ? paymentTerms : existing.paymentTerms,
      additionalInfo: Array.isArray(additionalInfo) ? additionalInfo : existing.additionalInfo,
      trainers: Array.isArray(trainers) ? trainers : existing.trainers,
      preparedBy: preparedBy || existing.preparedBy,
      motto: FIXED_MOTTO,
      updatedAt: new Date().toISOString(),
    };

    inMemoryQuotations = inMemoryQuotations.map((q) => (q.id === id ? updatedDoc : q));

    try {
      const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
      await col.updateOne({ id }, { $set: updatedDoc as any }, { upsert: true });
      console.log(`[QUOTATIONS] Quotation ${updatedDoc.quotationNo} successfully updated in MongoDB database.`);
    } catch (dbErr) {
      console.warn("[QUOTATIONS] Mongo update warning:", dbErr);
    }

    res.json(updatedDoc);
  } catch (e) {
    console.error("Update quotation error:", e);
    res.status(500).json({ error: "Failed to update quotation" });
  }
}

export async function deleteQuotation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    inMemoryQuotations = inMemoryQuotations.filter((q) => q.id !== id);

    try {
      const col = mongoCollection<Quotation>(MONGO_COLLECTIONS.quotations);
      await col.deleteOne({ id });
    } catch (dbErr) {
      console.warn("[QUOTATIONS] Mongo delete warning:", dbErr);
    }

    res.json({ success: true });
  } catch (e) {
    console.error("Delete quotation error:", e);
    res.status(500).json({ error: "Failed to delete quotation" });
  }
}
