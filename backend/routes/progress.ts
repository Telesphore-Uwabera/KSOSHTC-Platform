import { Request, Response } from "express";
import type { ProgressDoc } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";

function progressCol() {
  return mongoCollection<ProgressDoc>(MONGO_COLLECTIONS.progress);
}

function progressId(userId: string, courseId: string): string {
  return [userId, courseId].join("_");
}

export async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const { userId, courseId } = req.query as { userId?: string; courseId?: string };
    if (!userId) {
      res.status(400).json({ error: "userId is required." });
      return;
    }
    const col = progressCol();
    if (courseId) {
      const id = progressId(userId, courseId);
      const doc = await col.findOne({ id });
      if (!doc) {
        res.json({
          progress: {
            id,
            userId,
            courseId,
            completedLessonIds: [],
            completedAssessmentIds: [],
            updatedAt: new Date().toISOString(),
          },
        });
        return;
      }
      res.json({
        progress: {
          ...doc,
          completedAssessmentIds: doc.completedAssessmentIds ?? [],
        },
      });
      return;
    }
    const progressList = await col.find({ userId }).toArray();
    res.json({
      progress: progressList.map((data) => ({
        ...data,
        completedAssessmentIds: data.completedAssessmentIds ?? [],
      })),
    });
  } catch (e) {
    console.error("getProgress:", e);
    res.status(500).json({ error: "Failed to get progress." });
  }
}

export async function patchProgress(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      userId: string;
      courseId: string;
      completedLessonId?: string;
      completedAssessmentId?: string;
    };
    const { userId, courseId, completedLessonId, completedAssessmentId } = body;
    if (!userId || !courseId) {
      res.status(400).json({ error: "userId and courseId are required." });
      return;
    }
    const id = progressId(userId, courseId);
    const col = progressCol();
    const snap = await col.findOne({ id });
    const now = new Date().toISOString();
    if (!snap) {
      const data: ProgressDoc = {
        id,
        userId,
        courseId,
        completedLessonIds: completedLessonId ? [completedLessonId] : [],
        completedAssessmentIds: completedAssessmentId ? [completedAssessmentId] : [],
        lastLessonId: completedLessonId,
        updatedAt: now,
      };
      await col.insertOne(data as any);
      res.json({ progress: data });
      return;
    }
    const current = snap;
    const completedLessonIds = [...(current.completedLessonIds ?? [])];
    const completedAssessmentIds = [...(current.completedAssessmentIds ?? [])];
    if (completedLessonId && !completedLessonIds.includes(completedLessonId)) {
      completedLessonIds.push(completedLessonId);
    }
    if (completedAssessmentId && !completedAssessmentIds.includes(completedAssessmentId)) {
      completedAssessmentIds.push(completedAssessmentId);
    }
    const updated: ProgressDoc = {
      ...current,
      completedLessonIds,
      completedAssessmentIds,
      lastLessonId: completedLessonId ?? current.lastLessonId,
      updatedAt: now,
    };
    await col.replaceOne({ id }, updated as any);
    res.json({ progress: updated });
  } catch (e) {
    console.error("patchProgress:", e);
    res.status(500).json({ error: "Failed to update progress." });
  }
}
