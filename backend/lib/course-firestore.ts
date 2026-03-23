/**
 * Firestore helpers for course content: courses, modules (subunits), lessons, assessments.
 */
import type { CourseId } from "@shared/api";
import { getDb } from "./firestore";

const COURSES_COLLECTION = "courses";
const MODULES_SUB = "modules";
const LESSONS_SUB = "lessons";
const ASSESSMENTS_SUB = "assessments";

export function coursesRef() {
  return getDb().collection(COURSES_COLLECTION);
}

export function courseDoc(courseId: string) {
  return coursesRef().doc(courseId);
}

export function modulesRef(courseId: string) {
  return courseDoc(courseId).collection(MODULES_SUB);
}

export function moduleDoc(courseId: string, moduleId: string) {
  return modulesRef(courseId).doc(moduleId);
}

export function lessonsRef(courseId: string, moduleId: string) {
  return moduleDoc(courseId, moduleId).collection(LESSONS_SUB);
}

export function lessonDoc(courseId: string, moduleId: string, lessonId: string) {
  return lessonsRef(courseId, moduleId).doc(lessonId);
}

export function assessmentsRef(courseId: string, moduleId: string) {
  return moduleDoc(courseId, moduleId).collection(ASSESSMENTS_SUB);
}

export function assessmentDoc(courseId: string, moduleId: string, assessmentId: string) {
  return assessmentsRef(courseId, moduleId).doc(assessmentId);
}

export const VALID_COURSE_SLUGS: CourseId[] = [
  "construction",
  "industrial-safety",
  "mining",
  "safety-management",
  "safety-for-all",
];

export function isValidCourseSlug(slug: string): slug is CourseId {
  return (VALID_COURSE_SLUGS as string[]).includes(slug);
}
