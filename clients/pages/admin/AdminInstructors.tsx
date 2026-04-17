import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, UserCog, CheckCircle2 } from "lucide-react";
import type { CourseDoc, Instructor, LearnerSector } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

const SECTOR_OPTIONS: { value: LearnerSector | ""; label: string }[] = [
  { value: "", label: "—" },
  { value: "construction", label: "Construction" },
  { value: "industrial-safety", label: "Industrial Safety" },
  { value: "mining", label: "Mining" },
];

async function fetchInstructors(): Promise<Instructor[]> {
  const res = await adminFetch(getApiBase() + "/api/instructors");
  if (!res.ok) throw new Error("Failed to load instructors");
  const data = await res.json();
  return (data as { instructors: Instructor[] }).instructors ?? [];
}

async function fetchCourses(): Promise<CourseDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.courses ?? []) as CourseDoc[];
}

type InstructorForm = {
  name: string;
  email: string;
  phone?: string;
  staffId?: string;
  organization?: string;
  sector?: LearnerSector | "";
  active: boolean;
  notes?: string;
  allowedCourseIds: string[];
};

function emptyForm(): InstructorForm {
  return { name: "", email: "", phone: "", staffId: "", organization: "", sector: "", active: true, notes: "", allowedCourseIds: [] };
}

async function createInstructor(body: InstructorForm): Promise<Instructor> {
  const res = await adminFetch(getApiBase() + "/api/instructors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to create instructor");
  return (data as { instructor: Instructor }).instructor;
}

async function updateInstructor(id: string, body: Partial<InstructorForm>): Promise<Instructor> {
  const res = await adminFetch(getApiBase() + `/api/instructors/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to update instructor");
  return (data as { instructor: Instructor }).instructor;
}

async function deleteInstructor(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/instructors/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to delete instructor");
  }
}

export default function AdminInstructors() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Instructor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<InstructorForm>(emptyForm());

  const { data: instructors = [], isLoading } = useQuery({ queryKey: ["instructors"], queryFn: fetchInstructors });
  const { data: courses = [] } = useQuery({ queryKey: ["course-content", "courses"], queryFn: fetchCourses });

  const coursesById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);

  const createMut = useMutation({
    mutationFn: (b: InstructorForm) => createInstructor(b),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instructors"] });
      setSuccess("Instructor created. A password setup email has been sent.");
      setError("");
      setCreateOpen(false);
      setForm(emptyForm());
      setTimeout(() => setSuccess(""), 6000);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to create instructor"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<InstructorForm> }) => updateInstructor(id, body),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["instructors"] });
      setEdit(null);
      setSuccess(`Updated ${updated.name}.`);
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to update instructor"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteInstructor(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instructors"] });
      setDeleteId(null);
      setSuccess("Instructor deleted.");
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to delete instructor"),
  });

  const openCreate = () => {
    setError("");
    setSuccess("");
    setForm(emptyForm());
    setCreateOpen(true);
  };

  const openEdit = (i: Instructor) => {
    setError("");
    setSuccess("");
    setEdit(i);
    setForm({
      name: i.name ?? "",
      email: i.email ?? "",
      phone: i.phone ?? "",
      staffId: i.staffId ?? "",
      organization: i.organization ?? "",
      sector: (i.sector ?? "") as any,
      active: i.active !== false,
      notes: i.notes ?? "",
      allowedCourseIds: (i.allowedCourseIds ?? []) as any,
    });
  };

  const submit = () => {
    setError("");
    const payload: InstructorForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      staffId: form.staffId?.trim() || undefined,
      organization: form.organization?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      sector: form.sector || undefined,
      allowedCourseIds: form.allowedCourseIds,
    };
    if (!payload.name || !payload.email) {
      setError("Name and email are required.");
      return;
    }
    if (edit) updateMut.mutate({ id: edit.id, body: payload });
    else createMut.mutate(payload);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <UserCog className="w-7 h-7" />
              Instructors
            </h1>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              Create and manage instructor accounts. New instructors receive a password setup email automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add instructor
          </button>
        </div>

        {success && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5" /> {success}
          </div>
        )}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        {isLoading ? (
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : instructors.length === 0 ? (
          <p className="text-gray-600 text-sm">No instructors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Courses</th>
                  <th className="py-2 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instructors.map((i) => (
                  <tr key={i.id} className="text-gray-800">
                    <td className="py-3 pr-4 font-semibold">{i.name}</td>
                    <td className="py-3 pr-4">{i.email}</td>
                    <td className="py-3 pr-4">
                      <span className={i.active ? "text-green-700 font-semibold" : "text-gray-500 font-semibold"}>{i.active ? "Active" : "Disabled"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-gray-600">
                        {(i.allowedCourseIds ?? []).map((cid) => coursesById[cid]?.title ?? cid).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-0">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(i)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(i.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(createOpen || edit) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-[30px] border border-gray-200 shadow-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-gray-900">{edit ? "Edit instructor" : "Add instructor"}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {edit ? "Update instructor details and permissions." : "Create a new instructor account."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setEdit(null);
                }}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                <input
                  value={form.staffId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization/Department</label>
                <input
                  value={form.organization ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                <select
                  value={form.sector ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value as any }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary bg-white"
                >
                  {SECTOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed courses</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {courses.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.allowedCourseIds.includes(c.id)}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            allowedCourseIds: e.target.checked
                              ? [...f.allowedCourseIds, c.id]
                              : f.allowedCourseIds.filter((x) => x !== c.id),
                          }));
                        }}
                      />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setEdit(null);
                }}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={createMut.isPending || updateMut.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-[30px] border border-gray-200 shadow-xl p-6 sm:p-8">
            <p className="text-lg font-bold text-gray-900">Delete instructor?</p>
            <p className="text-sm text-gray-600 mt-2">This will delete the instructor profile and linked login account.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMut.mutate(deleteId)}
                disabled={deleteMut.isPending}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deleteMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

