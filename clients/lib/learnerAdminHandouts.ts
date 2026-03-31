import type { AdminDistributedAssignmentDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";

export function buildAdminHandoutStreamUrl(pdfUrl: string, filename: string): string {
  const base = getApiBase();
  const q = new URLSearchParams();
  q.set("url", pdfUrl);
  q.set("filename", filename);
  return `${base}/api/course-content/stream-document?${q.toString()}`;
}

export async function fetchLearnerHandouts(userId: string): Promise<AdminDistributedAssignmentDoc[]> {
  const res = await fetch(
    getApiBase() + "/api/admin-distributed-assignments/for-learner?userId=" + encodeURIComponent(userId)
  );
  if (!res.ok) throw new Error("Failed to load materials");
  const data = await res.json();
  return data.assignments ?? [];
}
