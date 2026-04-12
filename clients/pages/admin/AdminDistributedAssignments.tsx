import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, ExternalLink, Send } from "lucide-react";
import type { AdminDistributedAssignmentDoc, CourseDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";
import { FILE_INPUT_ACCEPT_ATTR } from "@shared/allowedUploads";

function buildStreamUrl(pdfUrl: string, filename: string): string {
  const base = getApiBase();
  const q = new URLSearchParams();
  q.set("url", pdfUrl);
  q.set("filename", filename);
  return `${base}/api/course-content/stream-document?${q.toString()}`;
}

async function fetchCourses(): Promise<CourseDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data.courses ?? []).filter((c: CourseDoc) => c.published !== false);
}

async function fetchList(): Promise<AdminDistributedAssignmentDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/admin-distributed-assignments");
  if (!res.ok) throw new Error("Failed to load handouts");
  const data = await res.json();
  return data.assignments ?? [];
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

export default function AdminDistributedAssignments() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["course-content", "courses"],
    queryFn: fetchCourses,
  });

  const { data: list = [], isLoading: listLoading } = useQuery({
    queryKey: ["admin-distributed-assignments"],
    queryFn: fetchList,
  });

  const postMut = useMutation({
    mutationFn: async () => {
      const courseIds = Object.entries(selected)
        .filter(([, on]) => on)
        .map(([id]) => id);
      if (!title.trim() || !file || courseIds.length === 0) {
        throw new Error("Title, a file, and at least one target course are required.");
      }
      const contentBase64 = await fileToBase64(file);
      const res = await adminFetch(getApiBase() + "/api/admin-distributed-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          filename: file.name,
          contentBase64,
          courseIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Publish failed");
      return data as { learnersNotified?: number };
    },
    onSuccess: (data) => {
      setTitle("");
      setDescription("");
      setFile(null);
      setSelected({});
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-distributed-assignments"] });
      const n = data?.learnersNotified ?? 0;
      setSuccessMsg(
        `Published. ${n} learner account(s) matched your course selection and were sent an email (if email is configured).`
      );
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggleCourse = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const courseTitleById = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7" />
          Distribute assignment / quiz
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-1">
          Upload a document (PDF, Word, Excel, PowerPoint, images, etc.) and choose which courses it applies to. Only
          learners who may access those courses (by enrollment or sector rules) are emailed and see the file under
          Submit work.
        </p>

        <form
          className="mt-6 space-y-4 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            setSuccessMsg(null);
            postMut.mutate();
          }}
        >
          <div>
            <label htmlFor="ada-title" className="block text-sm font-semibold text-gray-800 mb-1">
              Title
            </label>
            <input
              id="ada-title"
              type="text"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="e.g. Week 3 take-home quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="ada-desc" className="block text-sm font-semibold text-gray-800 mb-1">
              Short description (optional)
            </label>
            <textarea
              id="ada-desc"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="Instructions or due date — shown in the email"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <span className="block text-sm font-semibold text-gray-800 mb-2">Target courses</span>
            {coursesLoading ? (
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading courses…
              </p>
            ) : (
              <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {courses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      id={`ada-c-${c.id}`}
                      checked={!!selected[c.id]}
                      onChange={() => toggleCourse(c.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary"
                    />
                    <label htmlFor={`ada-c-${c.id}`} className="text-sm text-gray-800 cursor-pointer flex-1">
                      <span className="font-medium">{c.title}</span>
                      <span className="text-gray-500 ml-2">({c.id})</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="ada-file" className="block text-sm font-semibold text-gray-800 mb-1">
              File
            </label>
            <input
              id="ada-file"
              type="file"
              accept={FILE_INPUT_ACCEPT_ATTR}
              className="w-full text-sm text-gray-600"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {successMsg && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">{successMsg}</p>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={postMut.isPending || courses.length === 0}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-95 disabled:opacity-50"
          >
            {postMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish and notify learners
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-primary mb-3">Published handouts</h2>
        {listLoading && (
          <p className="text-gray-500 text-sm flex items-center gap-2 py-6">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </p>
        )}
        {!listLoading && list.length === 0 && (
          <p className="text-gray-600 text-sm py-6">No handouts published yet.</p>
        )}
        {!listLoading && list.length > 0 && (
          <ul className="space-y-2 text-sm">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString()} ·{" "}
                    {a.courseIds?.map((id) => courseTitleById[id] ?? id).join(", ")}
                  </p>
                </div>
                <a
                  href={buildStreamUrl(a.pdfUrl, a.originalFilename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary font-semibold shrink-0"
                >
                  Open file <ExternalLink className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
