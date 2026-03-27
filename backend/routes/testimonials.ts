import { RequestHandler } from "express";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { Testimonial, TestimonialCreate } from "@shared/api";
import crypto from "node:crypto";

const TESTIMONIALS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let testimonialsCache: { fetchedAt: number; data: Testimonial[] } | null = null;

export const getTestimonials: RequestHandler = async (_req, res) => {
  try {
    if (testimonialsCache && Date.now() - testimonialsCache.fetchedAt < TESTIMONIALS_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
      res.json(testimonialsCache.data);
      return;
    }
    const col = mongoCollection<Testimonial>(MONGO_COLLECTIONS.testimonials);
    const list = await col
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    testimonialsCache = { fetchedAt: Date.now(), data: list };
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
    res.json(list);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Get testimonials error:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to load testimonials" });
  }
};

export const postTestimonial: RequestHandler = async (req, res) => {
  try {
    const body = req.body as Partial<TestimonialCreate>;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const role = typeof body?.role === "string" ? body.role.trim() : "";
    const quote = typeof body?.quote === "string" ? body.quote.trim() : "";
    if (!name || !quote) {
      res.status(400).json({ error: "name and quote are required" });
      return;
    }
    const testimonial: Testimonial = {
      id: crypto.randomUUID(),
      name,
      role: role || "Participant",
      quote,
      avatarUrl: typeof body?.avatarUrl === "string" ? body.avatarUrl.trim() || undefined : undefined,
      createdAt: new Date().toISOString(),
    };
    const col = mongoCollection<Testimonial>(MONGO_COLLECTIONS.testimonials);
    await col.insertOne(testimonial as any);
    testimonialsCache = null;
    res.status(201).json(testimonial);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Post testimonial error:", msg, e instanceof Error ? e.stack : "");
    res.status(500).json({ error: "Failed to add testimonial" });
  }
};
