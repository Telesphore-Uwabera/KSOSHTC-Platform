import { Request, Response } from "express";
import type { CoursePublic, CourseUsageItem, EnrollmentDoc } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "../lib/mongo";

const COURSES: CoursePublic[] = [
  { id: "construction", title: "OSH in Construction", sector: "Construction", duration: "3 months" },
  { id: "industrial-safety", title: "OSH in Industrial Safety", sector: "Industrial", duration: "3 months" },
  { id: "mining", title: "OSH in Mining", sector: "Mining", duration: "3 months" },
  { id: "safety-management", title: "Safety Management (General)", sector: "General", duration: "3 months" },
  { id: "safety-for-all", title: "Safety Course for All", sector: "General", duration: "3 months" },
];

/** GET /api/analytics/course-usage – course usage for dashboard (main dashboard only) */
export async function getCourseUsage(_req: Request, res: Response): Promise<void> {
  try {
    const enrollCol = mongoCollection<EnrollmentDoc>(MONGO_COLLECTIONS.enrollments);
    const quizCol = mongoCollection<{ courseId: string }>(MONGO_COLLECTIONS.quizzes);
    const usage: CourseUsageItem[] = [];
    for (const course of COURSES) {
      const [quizDoc, enrollmentsForCourse] = await Promise.all([
        quizCol.findOne({ courseId: course.id }),
        enrollCol.find({ courseId: course.id }).toArray(),
      ]);
      const hasQuiz = !!quizDoc;
      const enrollmentCount = enrollmentsForCourse.length;
      const completionCount = enrollmentsForCourse.filter((d) => d.status === "completed").length;
      const completionRatePercent =
        enrollmentCount > 0 ? Math.round((completionCount / enrollmentCount) * 100) : 0;
      usage.push({
        courseId: course.id,
        title: course.title,
        sector: course.sector,
        duration: course.duration,
        hasQuiz,
        enrollmentCount,
        completionCount,
        completionRatePercent,
      });
    }
    res.json({ courseUsage: usage });
  } catch (e) {
    console.error("Course usage error:", e);
    res.status(500).json({ error: "Failed to load course usage." });
  }
}
