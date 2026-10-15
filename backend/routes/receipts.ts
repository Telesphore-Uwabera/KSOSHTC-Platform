import { Request, Response } from "express";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { sendReceiptEmail } from "../lib/notify";
import type { FeeReceipt, FeeReceiptCreate, FeeReceiptUpdate } from "@shared/api";
import { DEFAULT_RECEIPT_TERMS } from "@shared/api";

// In-memory fallback if Mongo is disconnected or for seamless dev
let inMemoryReceipts: FeeReceipt[] = [];

function receiptsCol() {
  return mongoCollection<FeeReceipt>(MONGO_COLLECTIONS.receipts);
}

export async function getNextReceiptNo(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `KSOSHTC/REC/${currentYear}/`;
  try {
    const col = receiptsCol();
    const lastDocs = await col
      .find({ receiptNo: { $regex: `^${prefix}` } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    let seq = 1;
    if (lastDocs.length > 0 && lastDocs[0].receiptNo) {
      const parts = lastDocs[0].receiptNo.split(prefix);
      if (parts[1]) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) seq = num + 1;
      }
    }
    return `${prefix}${String(seq).padStart(3, "0")}`;
  } catch {
    const fallbackSeq = inMemoryReceipts.length + 1;
    return `${prefix}${String(fallbackSeq).padStart(3, "0")}`;
  }
}

export async function getReceipts(req: Request, res: Response): Promise<void> {
  try {
    const col = receiptsCol();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    res.json(docs);
  } catch (e) {
    console.warn("[RECEIPTS] Failed to fetch from Mongo, using in-memory store:", e);
    res.json(inMemoryReceipts);
  }
}

export async function getReceiptById(req: Request, res: Response): Promise<void> {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId) {
      res.status(400).json({ error: "Missing receipt ID parameter" });
      return;
    }

    const col = receiptsCol();
    const escaped = rawId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}$`, "i");

    const orConditions: any[] = [
      { id: rawId },
      { invoiceId: rawId },
      { receiptNo: rawId },
      { invoiceId: { $regex: regex } },
      { receiptNo: { $regex: regex } },
    ];

    if (ObjectId.isValid(rawId)) {
      try {
        orConditions.push({ _id: new ObjectId(rawId) });
      } catch {}
    }

    const doc = await col.findOne({ $or: orConditions });
    if (doc) {
      res.json(doc);
      return;
    }

    const mem = inMemoryReceipts.find(
      (r) =>
        r.id === rawId ||
        r.invoiceId?.toLowerCase() === rawId.toLowerCase() ||
        r.receiptNo?.toLowerCase() === rawId.toLowerCase()
    );
    if (mem) {
      res.json(mem);
      return;
    }
    res.status(404).json({ error: "Receipt not found" });
  } catch (e) {
    console.error("[RECEIPTS] Error fetching receipt:", e);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
}

export async function createReceipt(req: Request, res: Response): Promise<void> {
  try {
    const body: FeeReceiptCreate = req.body;
    if (!body.receivedFrom) {
      res.status(400).json({ error: "Student / Payer name is required." });
      return;
    }

    const receiptNo = body.receiptNo?.trim() || (await getNextReceiptNo());
    // Use Invoice ID as primary key identifier
    const invoiceId =
      body.invoiceId?.trim() ||
      (body.invoiceDetails && body.invoiceDetails[0]?.invoiceNo?.trim()) ||
      receiptNo.replace(/[^a-zA-Z0-9_-]/g, "") ||
      `INV-${Date.now().toString().slice(-6)}`;

    const now = new Date().toISOString();

    const newReceipt: FeeReceipt = {
      id: invoiceId, // Invoice ID as primary key
      invoiceId,
      receiptNo,
      receiptDate: body.receiptDate || new Date().toLocaleDateString("en-GB"),
      receivedIn: body.receivedIn || "Bank / MoMo",
      chequeTranNo: body.chequeTranNo || "",
      receivedFee: Number(body.receivedFee) || 0,
      currency: body.currency || "RWF",

      receivedFrom: body.receivedFrom.trim(),
      idCardNo: body.idCardNo || "",
      payerEmail: body.payerEmail?.trim() || "",
      payerPhone: body.payerPhone?.trim() || "",

      companyName: body.companyName || "Kigali Safety OSH Training Center (KSOSHTC)",
      companyTagline: body.companyTagline || "Safety today, prosperity tomorrow.",
      companyAddress: body.companyAddress || "Kicukiro, Kigali, Rwanda · Phone: +250 785 072 512 · ksoshtc@gmail.com",
      panNumber: body.panNumber || "RTB Accredited Institution",
      gstinNumber: body.gstinNumber || "TIN: 108520137",
      logoUrl: body.logoUrl || "/logo_transparent.webp",

      // Stamp and Signature
      signatoryName: body.signatoryName || "Emmanuel NIYOBUHUNGIRO",
      signatoryTitle: body.signatoryTitle || "Authorized Signatory - Finance & Administration",
      showStamp: body.showStamp !== false,
      showSignature: body.showSignature !== false,
      stampUrl: body.stampUrl || "/certificate/stamp.webp",

      invoiceDetails: Array.isArray(body.invoiceDetails) ? body.invoiceDetails : [],
      installments: Array.isArray(body.installments) ? body.installments : [],

      termsAndConditions: Array.isArray(body.termsAndConditions) && body.termsAndConditions.length > 0
        ? body.termsAndConditions
        : DEFAULT_RECEIPT_TERMS,
      policyUrl: body.policyUrl || "",

      createdAt: now,
      updatedAt: now,
    };

    try {
      const col = receiptsCol();
      await col.insertOne(newReceipt as any);
    } catch (dbErr) {
      console.warn("[RECEIPTS] Failed to save in Mongo, keeping in memory:", dbErr);
    }
    inMemoryReceipts.unshift(newReceipt);

    res.status(201).json(newReceipt);
  } catch (e) {
    console.error("[RECEIPTS] Error creating receipt:", e);
    res.status(500).json({ error: "Failed to create receipt" });
  }
}

export async function updateReceipt(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body: FeeReceiptUpdate = req.body;
    const now = new Date().toISOString();

    const updateData = {
      ...body,
      updatedAt: now,
    };

    try {
      const col = receiptsCol();
      await col.updateOne({ id }, { $set: updateData });
    } catch (dbErr) {
      console.warn("[RECEIPTS] Failed to update in Mongo:", dbErr);
    }

    const idx = inMemoryReceipts.findIndex((r) => r.id === id);
    if (idx !== -1) {
      inMemoryReceipts[idx] = { ...inMemoryReceipts[idx], ...updateData };
    }

    res.json({ message: "Receipt updated successfully" });
  } catch (e) {
    console.error("[RECEIPTS] Error updating receipt:", e);
    res.status(500).json({ error: "Failed to update receipt" });
  }
}

export async function deleteReceipt(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    try {
      const col = receiptsCol();
      await col.deleteOne({ id });
    } catch (dbErr) {
      console.warn("[RECEIPTS] Failed to delete from Mongo:", dbErr);
    }
    inMemoryReceipts = inMemoryReceipts.filter((r) => r.id !== id);
    res.json({ message: "Receipt deleted successfully" });
  } catch (e) {
    console.error("[RECEIPTS] Error deleting receipt:", e);
    res.status(500).json({ error: "Failed to delete receipt" });
  }
}

export async function sendReceiptEmailEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email, pdfBase64, payerName, receiptNo, amount, currency, packageName } = req.body;

    const targetEmail = (email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      res.status(400).json({ error: "A valid payer email address is required to send receipt." });
      return;
    }

    let receipt: FeeReceipt | null = null;
    try {
      const col = receiptsCol();
      receipt = await col.findOne({ id });
    } catch {
      receipt = inMemoryReceipts.find((r) => r.id === id) || null;
    }

    const resolvedName = payerName || receipt?.receivedFrom || "Student / Payer";
    const resolvedNo = receiptNo || receipt?.receiptNo || id;
    const resolvedAmount = amount ?? receipt?.receivedFee ?? 0;
    const resolvedCurrency = currency || receipt?.currency || "RWF";
    const resolvedPackage =
      packageName ||
      (receipt?.invoiceDetails && receipt.invoiceDetails[0]?.packageDetails) ||
      "Course Fees";

    await sendReceiptEmail({
      to: targetEmail,
      payerName: resolvedName,
      receiptNo: resolvedNo,
      amount: resolvedAmount,
      currency: resolvedCurrency,
      packageName: resolvedPackage,
      pdfBase64,
    });

    const sentAt = new Date().toISOString();
    try {
      const col = receiptsCol();
      await col.updateOne({ id }, { $set: { sentAt, sentTo: targetEmail } });
    } catch {}

    const mem = inMemoryReceipts.find((r) => r.id === id);
    if (mem) {
      mem.sentAt = sentAt;
      mem.sentTo = targetEmail;
    }

    res.json({ message: `Receipt successfully sent to ${targetEmail}`, sentAt });
  } catch (e) {
    console.error("[RECEIPTS] Error sending receipt email:", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to send receipt email" });
  }
}
