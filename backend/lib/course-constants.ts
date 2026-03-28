import type { CourseId } from "@shared/api";

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
