import { Request, Response } from "express";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { SettingsDoc } from "../../shared/api";
import { isAdminSessionAuthorized } from "../lib/adminSession";

function settingsCol() {
  return mongoCollection<SettingsDoc>(MONGO_COLLECTIONS.settings);
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const col = settingsCol();
    const settings = await col.findOne({ id: "singleton" });
    if (!settings) {
      res.json({ settings: { id: "singleton", isRegistrationActive: false } });
      return;
    }
    res.json({ settings });
  } catch (e) {
    console.error("getSettings error:", e);
    res.status(500).json({ error: "Failed to get settings." });
  }
}

export async function patchSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!isAdminSessionAuthorized(req)) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const { isRegistrationActive } = req.body;
    const col = settingsCol();
    await col.updateOne(
      { id: "singleton" },
      { $set: { isRegistrationActive: Boolean(isRegistrationActive) } },
      { upsert: true }
    );
    const settings = await col.findOne({ id: "singleton" });
    res.json({ settings });
  } catch (e) {
    console.error("patchSettings error:", e);
    res.status(500).json({ error: "Failed to update settings." });
  }
}
