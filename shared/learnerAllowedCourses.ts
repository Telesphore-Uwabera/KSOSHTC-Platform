import type { EnrollmentDoc, User } from "./api";
import { enrollmentAllowsLearnerAccess } from "./learnerEnrollment";

/**
 * Course IDs a learner may access (same rules as the learner dashboard).
 * Uses enrollments when any exist; otherwise sector + safety-management, or all published courses if no sector.
 */
export function allowedCourseIdsForLearner(
  user: Pick<User, "sector">,
  enrollmentsForUser: EnrollmentDoc[],
  publishedCourseIds: string[]
): Set<string> {
  const hasRows = enrollmentsForUser.length > 0;
  const visible = enrollmentsForUser.filter((e) => enrollmentAllowsLearnerAccess(e.status));
  if (hasRows) {
    return new Set(visible.map((e) => e.courseId));
  }
  if (!user.sector) {
    return new Set(publishedCourseIds);
  }
  return new Set(
    publishedCourseIds.filter((id) => id === "safety-management" || id === user.sector)
  );
}
