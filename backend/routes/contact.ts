import { Request, Response } from "express";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import { notifyNewContact } from "../lib/notify";

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function postContact(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { name?: string; email?: string; phone?: string; message?: string };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !phone || !message) {
      res.status(400).json({ error: "Name, email, phone, and message are required." });
      return;
    }

    const doc = {
      id: generateId(),
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString(),
    };

    await mongoCollection(MONGO_COLLECTIONS.inquiries).insertOne(doc as any);
    // Notify admin only after successful DB write
    notifyNewContact({ name: doc.name, email: doc.email, phone: doc.phone, message: doc.message }).catch((err) =>
      console.error("[CONTACT] Notify failed:", err)
    );
    res.status(201).json({ ok: true, id: doc.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[CONTACT]", msg);
    res.status(500).json({ error: "Failed to send message. Please try again or contact us by email." });
  }
}
