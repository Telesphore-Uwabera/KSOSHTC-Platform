import { Request, Response } from "express";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";
import type { Certificate } from "./certificates";
import type { ModuleDoc, LessonDoc } from "@shared/api";

export async function getCertificateCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const certCol = mongoCollection<Certificate>(MONGO_COLLECTIONS.certificates);
    const cert = await certCol.findOne({ $or: [{ id }, { certificateId: id }] });
    
    if (!cert) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    // 1. Try to find the exact course by title match first
    const courseCol = mongoCollection<any>(MONGO_COLLECTIONS.courses);
    const dbCourse = await courseCol.findOne({ 
      title: { $regex: new RegExp(`^${cert.courses.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    let courseId = "";
    
    if (dbCourse) {
      courseId = dbCourse.id;
    } else {
      // 2. Fallback to keyword mapping for legacy or slightly different titles
      const title = cert.courses.toLowerCase();
      if (title.includes("construction")) courseId = "construction";
      else if (title.includes("industrial")) courseId = "industrial-safety";
      else if (title.includes("mining")) courseId = "mining";
      else if (title.includes("management") || title.includes("general")) courseId = "safety-management";
      else courseId = "safety-for-all";
    }

    // Fetch all modules for this course
    const modules = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules)
      .find({ courseId })
      .sort({ order: 1 })
      .toArray();

    // Fetch all lessons for all modules in one go
    const curriculum = await Promise.all(modules.map(async (mod) => {
      const lessons = await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons)
        .find({ courseId, moduleId: mod.id })
        .sort({ order: 1 })
        .toArray();
      
      return {
        moduleTitle: mod.title,
        lessons: lessons.map(l => l.title)
      };
    }));

    // ALWAYS ADD the General Safety & Environment modules from the 'safety-management' course
    if (courseId !== "safety-management") {
      const generalModules = await mongoCollection<ModuleDoc>(MONGO_COLLECTIONS.modules)
        .find({ courseId: "safety-management" })
        .sort({ order: 1 })
        .toArray();

      const generalCurriculum = await Promise.all(generalModules.map(async (mod) => {
        const lessons = await mongoCollection<LessonDoc>(MONGO_COLLECTIONS.lessons)
          .find({ courseId: "safety-management", moduleId: mod.id })
          .sort({ order: 1 })
          .toArray();
        
        return {
          moduleTitle: mod.title,
          lessons: lessons.map(l => l.title)
        };
      }));

      curriculum.push(...generalCurriculum);
    }

    res.json({ curriculum });
  } catch (e) {
    console.error("getCertificateCurriculum error:", e);
    res.status(500).json({ error: "Failed to fetch curriculum data" });
  }
}
