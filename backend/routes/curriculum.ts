import { Request, Response } from "express";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { Certificate } from "./certificates";
import type { ModuleDoc, LessonDoc } from "@shared/api";

/**
 * Builds a flat list of lesson titles grouped by module for the transcript.
 * "Course Materials" = individual lessons within each module.
 * "Core Elements" = lessons within the Safety Management course modules.
 */
async function fetchLessonsForCourse(courseId: string): Promise<{ moduleTitle: string; lessons: string[] }[]> {
  const modules = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules)
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();

  const sections = await Promise.all(modules.map(async (mod) => {
    const lessons = await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons)
      .find({ courseId, moduleId: mod.id })
      .sort({ order: 1 })
      .toArray();

    return {
      moduleTitle: mod.title,
      // lesson.title is the actual course material name shown in the transcript
      lessons: lessons.map(l => l.title)
    };
  }));

  // Only include modules that actually have lessons (Course Materials)
  return sections.filter(s => s.lessons.length > 0);
}

export async function getCertificateCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const certCol = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const cert = await certCol.findOne({ $or: [{ id }, { certificateId: id }] });

    if (!cert) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    // 1. Exact title match in courses collection
    const courseCol = mongoCollection<any>(MONGO_COLLECTIONS.courses);
    const dbCourse = await courseCol.findOne({
      title: { $regex: new RegExp(`^${cert.courses.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    let courseId = "";
    if (dbCourse) {
      courseId = dbCourse.id;
    } else {
      // 2. Keyword fallback
      const title = cert.courses.toLowerCase();
      if (title.includes("construction")) courseId = "construction";
      else if (title.includes("industrial")) courseId = "industrial-safety";
      else if (title.includes("mining")) courseId = "mining";
      else if (title.includes("management") || title.includes("general")) courseId = "safety-management";
      else courseId = "safety-for-all";
    }

    // Fetch the specific program's Course Materials (lessons grouped by module)
    const programmeCurriculum = await fetchLessonsForCourse(courseId);

    // Always append Core Elements from Safety Management (unless this IS safety-management)
    let coreCurriculum: { moduleTitle: string; lessons: string[] }[] = [];
    if (courseId !== "safety-management") {
      coreCurriculum = await fetchLessonsForCourse("safety-management");
    }

    res.json({
      courseId,
      courseName: cert.courses,
      programme: programmeCurriculum,    // specific program Course Materials
      core: coreCurriculum,              // Core Elements from General Safety
    });
  } catch (e) {
    console.error("getCertificateCurriculum error:", e);
    res.status(500).json({ error: "Failed to fetch curriculum data" });
  }
}
