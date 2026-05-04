import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react";
import type { AssignmentSubmissionDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";
import { getStoredUser } from "@/lib/auth";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

function buildStreamUrl(pdfUrl: string, filename: string): string {
  const base = getApiBase();
  const q = new URLSearchParams();
  q.set("url", pdfUrl);
  q.set("filename", filename);
  return `${base}/api/course-content/stream-document?${q.toString()}`;
}

async function fetchAll(): Promise<AssignmentSubmissionDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/assignment-submissions");
  if (!res.ok) throw new Error("Failed to load submissions");
  const data = await res.json();
  return data.submissions ?? [];
}

export default function AdminAssignmentSubmissions() {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const isAdmin = user && typeof user === "object" ? (user as { role?: string }).role === "admin" : false;
  const [editing, setEditing] = useState<AssignmentSubmissionDoc | null>(null);
  const [marks, setMarks] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [feedback, setFeedback] = useState("");
  const [patchError, setPatchError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ["assignment-submissions", "admin"],
    queryFn: fetchAll,
  });

  const patchMut = useMutation({
    mutationFn: async (body: { id: string; marks: number; maxMarks: number; feedback: string }) => {
      const res = await adminFetch(getApiBase() + "/api/assignment-submissions/" + encodeURIComponent(body.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks: body.marks,
          maxMarks: body.maxMarks,
          feedback: body.feedback || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Update failed");
      return data;
    },
    onSuccess: () => {
      setEditing(null);
      setPatchError(null);
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", "admin"] });
    },
    onError: (e: Error) => setPatchError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(getApiBase() + "/api/assignment-submissions/" + encodeURIComponent(id), {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", "admin"] });
      toast.success("Submission deleted", {
        description: "The learner file was removed from storage and the record was deleted.",
      });
    },
    onError: (e: Error) => {
      toast.error("Could not delete submission", { description: e.message });
    },
  });

  const openEdit = (s: AssignmentSubmissionDoc) => {
    setEditing(s);
    setMarks(typeof s.marks === "number" ? String(s.marks) : "");
    setMaxMarks(String(s.maxMarks ?? 100));
    setFeedback(s.feedback ?? "");
    setPatchError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
          <ClipboardList className="w-7 h-7" />
          Assignment submissions
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-1">
          Open each submission, then record marks and optional feedback. Learners are emailed when marks are set or changed.
          {isAdmin ? " Administrators can permanently delete a submission and its uploaded file." : ""}
        </p>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-4 sm:p-6 overflow-x-auto">
        {isLoading && (
          <p className="text-gray-500 text-sm flex items-center gap-2 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </p>
        )}
        {error && (
          <p className="text-red-600 text-sm py-4">{(error as Error).message}</p>
        )}
        {!isLoading && !error && submissions.length === 0 && (
          <p className="text-gray-600 text-sm py-8 text-center">No submissions yet.</p>
        )}
        {!isLoading && submissions.length > 0 && (
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium">
                <th className="py-2 pr-3">Submitted</th>
                <th className="py-2 pr-3">Learner</th>
                <th className="py-2 pr-3">Course</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Marks</th>
                <th className="py-2 pr-3">File</th>
                <th className="py-2 pr-2 w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 align-top">
                  <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="font-medium text-gray-900">{s.learnerName ?? "—"}</div>
                    <div className="text-xs text-gray-500 break-all">{s.learnerEmail ?? ""}</div>
                  </td>
                  <td className="py-3 pr-3 text-gray-800">{s.courseTitle ?? s.courseId}</td>
                  <td className="py-3 pr-3 text-gray-800 max-w-[200px]">{s.title}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {typeof s.marks === "number" ? (
                      <span className="font-semibold text-primary">
                        {s.marks} / {s.maxMarks ?? 100}
                      </span>
                    ) : (
                      <span className="text-amber-700">Pending</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <a
                      href={buildStreamUrl(s.pdfUrl, s.originalFilename)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-medium"
                    >
                      Open <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Grade
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={deleteMut.isPending}
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-dialog-title"
        >
          <div className="bg-white rounded-[24px] shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h2 id="grade-dialog-title" className="text-lg font-bold text-primary mb-1">
              Grade submission
            </h2>
            <p className="text-xs text-gray-600 mb-4 line-clamp-2">{editing.title}</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Out of</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Feedback (optional)</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[80px]"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Short comment for the learner…"
                />
              </div>
              {patchError && <p className="text-sm text-red-600">{patchError}</p>}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={patchMut.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-50"
                onClick={() => {
                  setPatchError(null);
                  const m = parseFloat(marks);
                  const mx = parseInt(maxMarks, 10);
                  if (!Number.isFinite(m) || m < 0) {
                    setPatchError("Enter a valid marks value.");
                    return;
                  }
                  if (!Number.isFinite(mx) || mx < 1) {
                    setPatchError("Out of must be at least 1.");
                    return;
                  }
                  if (m > mx) {
                    setPatchError("Marks cannot exceed the maximum.");
                    return;
                  }
                  patchMut.mutate({
                    id: editing.id,
                    marks: m,
                    maxMarks: mx,
                    feedback: feedback.trim(),
                  });
                }}
              >
                {patchMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save & notify learner
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteMut.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Delete Submission"
        description="Permanently delete this submission and remove the file from storage? This cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
