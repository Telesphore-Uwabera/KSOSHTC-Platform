/**
 * Learner-facing course access: dashboard, course pages, and assignment submission.
 * Only active and completed enrollments (or legacy rows with no status) grant access.
 */

export function enrollmentAllowsLearnerAccess(status: string | undefined | null): boolean {
  if (status == null || status === "") return true;
  return status === "active" || status === "completed";
}
