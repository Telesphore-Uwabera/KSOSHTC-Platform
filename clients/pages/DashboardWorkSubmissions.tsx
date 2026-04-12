import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, ExternalLink, FileText } from "lucide-react";
import type { AssignmentSubmissionDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { getStoredUser } from "../lib/auth";
import { Link } from "react-router-dom";
import { useDashboardData } from "./dashboardData";
import { buildAdminHandoutStreamUrl, fetchLearnerHandouts } from "@/lib/learnerAdminHandouts";
import { FILE_INPUT_ACCEPT_ATTR } from "@shared/allowedUploads";

function buildStreamUrl(pdfUrl: string, filename: string): string {
  const base = getApiBase();
  const q = new URLSearchParams();
  q.set("url", pdfUrl);
  q.set("filename", filename);
  return `${base}/api/course-content/stream-document?${q.toString()}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const i = result.indexOf(",");
      resolve(i >= 0 ? result.slice(i + 1) : result);
    };
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}

async function fetchMySubmissions(userId: string): Promise<AssignmentSubmissionDoc[]> {
  const res = await fetch(getApiBase() + "/api/assignment-submissions?userId=" + encodeURIComponent(userId));
  if (!res.ok) throw new Error("Failed to load submissions");
  const data = await res.json();
  return data.submissions ?? [];
}

export default function DashboardWorkSubmissions() {
  const user = getStoredUser();
  const { canAccess, courses, isLoading: coursesLoading } = useDashboardData();
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: submissions = [], isLoading: listLoading } = useQuery({
    queryKey: ["assignment-submissions", user?.id],
    queryFn: () => fetchMySubmissions(user?.id || ""),
    enabled: !!user?.id && canAccess,
  });

  const { data: handouts = [], isLoading: handoutsLoading } = useQuery({
    queryKey: ["admin-distributed-assignments", "learner", user?.id],
    queryFn: () => fetchLearnerHandouts(user?.id || ""),
    enabled: !!user?.id && canAccess,
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!user?.id || !courseId || !title.trim() || !file) {
        throw new Error("Choose a course, enter a title, and select a file.");
      }
      const contentBase64 = await fileToBase64(file);
      const res = await fetch(getApiBase() + "/api/assignment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseId,
          title: title.trim(),
          filename: file.name,
          contentBase64,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Submit failed");
      return data;
    },
    onSuccess: () => {
      setTitle("");
      setFile(null);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", user?.id] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  if (!user) return null;

  if (!canAccess) {
    return (
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-2">Registration under review</h2>
        <p className="text-gray-600">
          You can submit assignments after your account is approved.
        </p>
        <Link to="/dashboard" className="text-primary font-medium mt-4 inline-block">
          Back to overview
        </Link>
      </div>
    );
  }

  const courseLabel = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Materials from KSOSHTC
        </h2>
        <p className="text-gray-600 text-sm mb-2">
          Assignments or quiz materials your instructors shared for your courses. You are notified by email when new
          files apply to you.
        </p>
        <p className="text-sm mb-4">
          <Link to="/dashboard/handouts" className="font-semibold text-primary hover:underline">
            Open Assignments page
          </Link>{" "}
          for a full-screen list (same files as here).
        </p>
        {handoutsLoading ? (
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : handouts.length === 0 ? (
          <p className="text-gray-600 text-sm">No shared materials yet for your programme.</p>
        ) : (
          <ul className="space-y-3">
            {handouts.map((h) => (
              <li
                key={h.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{h.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {h.courseIds.map(courseLabel).join(" · ")} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                  {h.description ? (
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{h.description}</p>
                  ) : null}
                </div>
                <a
                  href={buildAdminHandoutStreamUrl(h.pdfUrl, h.originalFilename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary shrink-0"
                >
                  Open file <ExternalLink className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
          <FileUp className="w-7 h-7" />
          Submit work
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-1">
          Upload your completed assignment (PDF, Word, Excel, PowerPoint, images, or other supported document types) for
          a course you are enrolled in. You will receive an email when marks are released.
        </p>

        <form
          className="mt-6 space-y-4 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            submitMut.mutate();
          }}
        >
          <div>
            <label htmlFor="ws-course" className="block text-sm font-semibold text-gray-800 mb-1">
              Course
            </label>
            <select
              id="ws-course"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={coursesLoading || courses.length === 0}
              required
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {courses.length === 0 && !coursesLoading && (
              <p className="text-xs text-amber-700 mt-1">No courses available. Ask an admin to enroll you.</p>
            )}
          </div>
          <div>
            <label htmlFor="ws-title" className="block text-sm font-semibold text-gray-800 mb-1">
              Assignment title
            </label>
            <input
              id="ws-title"
              type="text"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="e.g. Module 2 — Hazard report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="ws-file" className="block text-sm font-semibold text-gray-800 mb-1">
              File
            </label>
            <input
              id="ws-file"
              type="file"
              accept={FILE_INPUT_ACCEPT_ATTR}
              className="w-full text-sm text-gray-600"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={submitMut.isPending || courses.length === 0}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-95 disabled:opacity-50"
          >
            {submitMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Submit
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-4">Your submissions</h2>
        {listLoading ? (
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : submissions.length === 0 ? (
          <p className="text-gray-600 text-sm">No submissions yet.</p>
        ) : (
          <ul className="space-y-3">
            {submissions.map((s) => {
              const hasMarks =
                typeof s.marks === "number" && Number.isFinite(s.marks);
              return (
                <li
                  key={s.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.courseTitle ?? s.courseId} · {new Date(s.submittedAt).toLocaleString()}
                    </p>
                    {hasMarks ? (
                      <p className="text-sm text-primary font-medium mt-1">
                        Marks: {s.marks} / {s.maxMarks ?? 100}
                        {s.feedback ? ` — ${s.feedback}` : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">Submitted and under review</p>
                    )}
                  </div>
                  <a
                    href={buildStreamUrl(s.pdfUrl, s.originalFilename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary shrink-0"
                  >
                    Open file <ExternalLink className="w-4 h-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
