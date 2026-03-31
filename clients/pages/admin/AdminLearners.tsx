import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle, Loader2, BookOpen, ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import type { UserPublic, EnrollmentDoc, EnrollmentStatus, CourseDoc, LearnerSector } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

const SECTOR_OPTIONS: { value: LearnerSector | ""; label: string }[] = [
  { value: "", label: "—" },
  { value: "construction", label: "Construction" },
  { value: "industrial-safety", label: "Industrial Safety" },
  { value: "mining", label: "Mining" },
];

type EnrollmentWithPerformance = EnrollmentDoc & { 
  completionPercent: number;
  quizPerformance?: Record<string, { score: number, maxScore: number, percentage: number, passed: boolean }>;
};

async function fetchLearnersSummary(): Promise<{
  users: UserPublic[];
  enrollmentsByUserId: Record<string, EnrollmentWithPerformance[]>;
}> {
  const res = await adminFetch(getApiBase() + "/api/users/learners-summary");
  if (!res.ok) throw new Error("Failed to load learners");
  return res.json();
}

async function fetchCourses(): Promise<CourseDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.courses ?? []).filter((c: CourseDoc) => c.published !== false);
}

async function approveUser(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to approve user");
}

async function updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/enrollments/${enrollmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update enrollment");
}

async function addEnrollment(userId: string, courseId: string): Promise<void> {
  const res = await adminFetch(getApiBase() + "/api/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, courseId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to add course enrollment");
  }
}

async function createLearner(body: { name: string; email: string; password: string; organization?: string; sector?: LearnerSector; approved?: boolean }): Promise<UserPublic> {
  const res = await adminFetch(getApiBase() + "/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to create learner");
  }
  const data = await res.json();
  return (data as { user: UserPublic }).user;
}

async function updateLearner(
  id: string,
  body: { name?: string; email?: string; password?: string; organization?: string; sector?: LearnerSector | ""; approved?: boolean }
): Promise<UserPublic> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to update learner");
  }
  const data = await res.json();
  return (data as { user: UserPublic }).user;
}

async function deleteLearner(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to delete learner");
  }
}

const statusLabel: Record<string, string> = {
  not_approved: "Not approved",
  active: "Active",
  completed: "Completed",
};

const statusClass: Record<string, string> = {
  not_approved: "bg-amber-100 text-amber-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default function AdminLearners() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserPublic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formSector, setFormSector] = useState<LearnerSector | "">("");
  const [formApproved, setFormApproved] = useState(false);
  const [formError, setFormError] = useState("");
  const [courseToAddByUserId, setCourseToAddByUserId] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["learners-summary"],
    queryFn: fetchLearnersSummary,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["course-content", "courses"],
    queryFn: fetchCourses,
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learners-summary"] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: EnrollmentStatus }) =>
      updateEnrollmentStatus(enrollmentId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learners-summary"] }),
  });

  const addEnrollmentMutation = useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      addEnrollment(userId, courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learners-summary"] }),
  });

  const createMutation = useMutation({
    mutationFn: createLearner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateLearner>[1] }) => updateLearner(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setEditUser(null);
      resetForm();
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLearner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setDeleteId(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  function resetForm() {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormOrg("");
    setFormSector("");
    setFormApproved(false);
    setFormError("");
  }

  function openEdit(u: UserPublic) {
    setEditUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword("");
    setFormOrg(u.organization ?? "");
    setFormSector(u.sector ?? "");
    setFormApproved(u.approved ?? false);
    setFormError("");
  }

  const courseTitleById = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const users = data?.users ?? [];
  const enrollmentsByUserId = data?.enrollmentsByUserId ?? {};

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2 mb-2">
          <Users className="w-6 h-6" />
          Learners management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-4">
          Approve users so they can access courses. View enrollments, status, and completion per course. Create, edit, or delete learners below.
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setFormApproved(false);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Create learner
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-sm mt-6 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-sm mt-6">No registered users yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Courses</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const enrollments = enrollmentsByUserId[u.id] ?? [];
                  const isExpanded = expandedId === u.id;
                  return (
                    <Fragment key={u.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : u.id)}
                            className="flex items-center gap-1.5 text-left font-medium text-gray-900 hover:text-primary"
                          >
                            {enrollments.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                              )
                            ) : (
                              <span className="w-4 shrink-0" />
                            )}
                            {u.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.organization ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {SECTOR_OPTIONS.find((o) => o.value === u.sector)?.label ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {u.approved ? (
                            <span className="text-green-600 font-medium">Approved</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {enrollments.length === 0
                            ? "—"
                            : `${enrollments.length} course${enrollments.length !== 1 ? "s" : ""}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!u.approved && (
                              <button
                                type="button"
                                onClick={() => approveMutation.mutate(u.id)}
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                              >
                                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                              title="Edit learner"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(u.id)}
                              className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              title="Delete learner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={7} className="px-4 py-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Enrollments</p>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              {(() => {
                                const enrolled = new Set(enrollments.map((en) => en.courseId));
                                const available = courses.filter((c) => !enrolled.has(c.id));
                                if (available.length === 0) {
                                  return (
                                    <p className="text-xs text-gray-500">
                                      All published courses are already assigned to this learner.
                                    </p>
                                  );
                                }
                                const selected = courseToAddByUserId[u.id] ?? available[0].id;
                                return (
                                  <>
                                    <select
                                      value={selected}
                                      onChange={(e) =>
                                        setCourseToAddByUserId((prev) => ({ ...prev, [u.id]: e.target.value }))
                                      }
                                      className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 bg-white outline-none focus:border-primary transition-colors"
                                    >
                                      {available.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.title}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addEnrollmentMutation.mutate({
                                          userId: u.id,
                                          courseId: selected,
                                        })
                                      }
                                      disabled={addEnrollmentMutation.isPending}
                                      className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
                                    >
                                      {addEnrollmentMutation.isPending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                      )}
                                      Add course
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex flex-col gap-2">
                              {enrollments.length === 0 ? (
                                <p className="text-xs text-gray-500 px-1">No courses assigned yet.</p>
                              ) : null}
                              {enrollments.map((en) => (
                                  <div
                                    key={en.id}
                                    className="flex flex-col gap-3 py-3 px-4 rounded-xl bg-white border border-gray-100 hover:border-primary/20 transition-all shadow-sm"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                          <BookOpen className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-gray-900 truncate">
                                            {courseTitleById[en.courseId] ?? en.courseId}
                                          </p>
                                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                                            Enrolled: {en.enrolledAt ? new Date(en.enrolledAt).toLocaleDateString() : '—'}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[en.status ?? "active"] ?? statusClass.active}`}
                                        >
                                          {statusLabel[en.status ?? "active"] ?? "Active"}
                                        </span>
                                        <select
                                          value={en.status ?? "active"}
                                          onChange={(e) =>
                                            updateStatusMutation.mutate({
                                              enrollmentId: en.id,
                                              status: e.target.value as EnrollmentStatus,
                                            })
                                          }
                                          disabled={updateStatusMutation.isPending}
                                          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 bg-white outline-none focus:border-primary transition-colors"
                                        >
                                          <option value="active">Active</option>
                                          <option value="completed">Completed</option>
                                          <option value="not_approved">Not approved</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Progress Area */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                                      <div>
                                        <div className="flex justify-between items-center mb-1.5 transition-all">
                                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Lesson Progress</span>
                                          <span className="text-sm font-bold text-primary leading-none">{en.completionPercent}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary rounded-full transition-all duration-500" 
                                            style={{ width: `${en.completionPercent}%` }}
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none block">Quiz Performance</span>
                                        {en.quizPerformance && Object.keys(en.quizPerformance).length > 0 ? (
                                          <div className="flex flex-wrap gap-2">
                                            {Object.entries(en.quizPerformance).map(([qId, perf]) => (
                                              <div 
                                                key={qId} 
                                                className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${
                                                  perf.passed 
                                                    ? 'bg-green-50 border-green-100 text-green-700' 
                                                    : 'bg-amber-50 border-amber-100 text-amber-700'
                                                }`}
                                                title={`Score: ${perf.score}/${perf.maxScore}`}
                                              >
                                                <div className={`w-1.5 h-1.5 rounded-full ${perf.passed ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                Quiz: {perf.percentage}%
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-[10px] italic text-gray-400 py-1">No quizzes attempted</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create learner modal */}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setCreateOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-primary">Create learner</h2>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Organization</label>
                <input type="text" value={formOrg} onChange={(e) => setFormOrg(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Sector</label>
                <select value={formSector} onChange={(e) => setFormSector(e.target.value as LearnerSector | "")} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white">
                  {SECTOR_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formApproved} onChange={(e) => setFormApproved(e.target.checked)} />
                  <span className="text-sm text-gray-700">Approved</span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formName.trim() || !formEmail.trim() || !formPassword) {
                      setFormError("Name, email, and password are required.");
                      return;
                    }
                    createMutation.mutate({
                      name: formName.trim(),
                      email: formEmail.trim(),
                      password: formPassword,
                      organization: formOrg.trim() || undefined,
                      sector: formSector || undefined,
                      approved: formApproved,
                    });
                  }}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
                >
                  {createMutation.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit learner modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditUser(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-primary">Edit learner</h2>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">New password (leave blank to keep)</label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Organization</label>
                <input type="text" value={formOrg} onChange={(e) => setFormOrg(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <label className="block text-sm font-medium text-gray-700">Sector</label>
                <select value={formSector} onChange={(e) => setFormSector(e.target.value as LearnerSector | "")} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white">
                  {SECTOR_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formApproved} onChange={(e) => setFormApproved(e.target.checked)} />
                  <span className="text-sm text-gray-700">Approved</span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formName.trim() || !formEmail.trim()) {
                      setFormError("Name and email are required.");
                      return;
                    }
                    updateMutation.mutate({
                      id: editUser.id,
                      body: {
                        name: formName.trim(),
                        email: formEmail.trim(),
                        password: formPassword || undefined,
                        organization: formOrg.trim() || undefined,
                        sector: formSector || undefined,
                        approved: formApproved,
                      },
                    });
                  }}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
                >
                  {updateMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteId(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900">Delete learner?</h2>
              <p className="text-sm text-gray-600">This will remove the learner and their enrollments, progress, and quiz submissions. This cannot be undone.</p>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

