import { Request, Response } from "express";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { SubscriberDoc } from "../../shared/api";
import { isAdminSessionAuthorized } from "../lib/adminSession";

function subscribersCol() {
  return mongoCollection<SubscriberDoc>(MONGO_COLLECTIONS.subscribers);
}

export async function postSubscriber(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    
    // Check if already subscribed
    const existing = await subscribersCol().findOne({ email: emailTrimmed });
    if (existing) {
      res.status(409).json({ error: "Already subscribed" });
      return;
    }

    const doc: SubscriberDoc = {
      email: emailTrimmed,
      subscribedAt: new Date().toISOString(),
    };

    await subscribersCol().insertOne(doc as any);

    res.status(201).json({ message: "Subscribed successfully" });
  } catch (e) {
    console.error("postSubscriber error:", e);
    res.status(500).json({ error: "Failed to subscribe" });
  }
}

export async function getSubscribers(req: Request, res: Response): Promise<void> {
  try {
    if (!isAdminSessionAuthorized(req)) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const list = await subscribersCol().find({}).sort({ subscribedAt: -1 }).toArray();
    res.json({ subscribers: list });
  } catch (e) {
    console.error("getSubscribers error:", e);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
}
