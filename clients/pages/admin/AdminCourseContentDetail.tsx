import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Youtube,
  FileText,
  ClipboardList,
  Loader2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  ImagePlus,
} from "lucide-react";
import type { CourseDoc, ModuleDoc, LessonDoc, AssessmentDoc } from "@shared/api";

import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";
import { SiteImage } from "@/components/SiteImage";
import { FILE_INPUT_ACCEPT_ATTR, isAllowedUploadExtension } from "@shared/allowedUploads";

const getCourseContentApi = () => getApiBase() + "/api/course-content";

async function fetchCourse(courseId: string): Promise<CourseDoc | null> {
  const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data as CourseDoc;
}

async function fetchModules(courseId: string): Promise<ModuleDoc[]> {
  const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { modules: ModuleDoc[] }).modules ?? [];
}

async function fetchLessons(courseId: string, moduleId: string): Promise<LessonDoc[]> {
  const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/lessons`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { lessons: LessonDoc[] }).lessons ?? [];
}

async function fetchAssessments(courseId: string, moduleId: string): Promise<AssessmentDoc[]> {
  const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { assessments: AssessmentDoc[] }).assessments ?? [];
}

function UploadDocumentBlock({
  courseId,
  getCourseContentApi,
  onSuccess,
}: {
  courseId: string;
  getCourseContentApi: () => string;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpload() {
    if (!file) {
      setError("Please select a file.");
      return;
    }
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (!isAllowedUploadExtension(ext)) {
      setError(`This file type is not allowed for course materials (got ${ext || "none"}).`);
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const result = r.result as string;
          const b64 = result.split(",")[1];
          if (b64) resolve(b64); else reject(new Error("Failed to read file"));
        };
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(file);
      });
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/upload-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentBase64: base64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Upload failed");
      setSuccess(`Uploaded ${(data as { filename?: string }).filename ?? file.name}. It will appear in course materials.`);
      setFile(null);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        type="file"
        accept={FILE_INPUT_ACCEPT_ATTR}
        onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); setSuccess(""); }}
        className="text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-semibold file:cursor-pointer"
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {uploading ? "Uploading…" : "Upload file"}
      </button>
      {error && <p className="text-red-600 text-sm w-full font-medium">{error}</p>}
      {success && <p className="text-green-700 text-sm w-full font-medium">{success}</p>}
    </div>
  );
}

function UploadCoverBlock({
  courseId,
  getCourseContentApi,
  onSuccess,
  currentCoverUrl,
}: {
  courseId: string;
  getCourseContentApi: () => string;
  onSuccess: () => void;
  currentCoverUrl?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpload() {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image (JPEG, PNG, or WebP).");
      return;
    }
    const contentType = (["image/jpeg", "image/png", "image/webp"].includes(file.type) ? file.type : "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const result = r.result as string;
          const b64 = result.split(",")[1];
          if (b64) resolve(b64);
          else reject(new Error("Failed to read file"));
        };
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(file);
      });
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/cover-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentBase64: base64, contentType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Upload failed");
      setSuccess("Thumbnail updated. It will show on the course card.");
      setFile(null);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {currentCoverUrl && (
        <SiteImage
          src={currentCoverUrl}
          alt="Course cover"
          className="h-12 w-auto rounded-lg border border-gray-200 object-cover"
          sizes="48px"
          cloudinaryMaxWidth={256}
          loading="lazy"
          decoding="async"
        />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); setSuccess(""); }}
        className="text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-semibold file:cursor-pointer"
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        {uploading ? "Uploading…" : "Upload thumbnail"}
      </button>
      {error && <p className="text-red-600 text-sm w-full">{error}</p>}
      {success && <p className="text-green-700 text-sm w-full">{success}</p>}
    </div>
  );
}

export default function AdminCourseContentDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const staffBase = location.pathname.startsWith("/instructor") ? "/instructor" : "/admin";
  const queryClient = useQueryClient();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState<LessonDoc | null>(null);
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [addingAssessment, setAddingAssessment] = useState<string | null>(null);
  const [editingCourseTitle, setEditingCourseTitle] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course-content", "course", courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["course-content", "modules", courseId],
    queryFn: () => fetchModules(courseId!),
    enabled: !!courseId,
  });

  const addModuleMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, order: modules.length }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to add module");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-content", "modules", courseId] });
      setNewModuleTitle("");
      setAddingModule(false);
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async ({ moduleId, title, youtubeUrl, pdfUrl, contentHtml }: { moduleId: string; title: string; youtubeUrl?: string; pdfUrl?: string; contentHtml?: string }) => {
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, order: 0, youtubeUrl: youtubeUrl || undefined, pdfUrl: pdfUrl || undefined, contentHtml: contentHtml || "" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to add lesson");
      }
      return res.json();
    },
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-content", "lessons", courseId, moduleId] });
      setAddingLesson(null);
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ moduleId, lessonId, title, youtubeUrl, pdfUrl, contentHtml }: { moduleId: string; lessonId: string; title: string; youtubeUrl?: string; pdfUrl?: string; contentHtml?: string }) => {
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, youtubeUrl: youtubeUrl || undefined, pdfUrl: pdfUrl || undefined, contentHtml: contentHtml || "" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update lesson");
      }
      return res.json();
    },
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-content", "lessons", courseId, moduleId] });
      setEditingLesson(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!window.confirm("Are you sure you want to delete this module and all its contents?")) return;
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete module");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-content", "modules", courseId] }),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async ({ moduleId, lessonId }: { moduleId: string, lessonId: string }) => {
      if (!window.confirm("Are you sure you want to delete this lesson?")) return;
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lesson");
    },
    onSuccess: (_, { moduleId }) => queryClient.invalidateQueries({ queryKey: ["course-content", "lessons", courseId, moduleId] }),
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: async ({ moduleId, assessmentId }: { moduleId: string, assessmentId: string }) => {
      if (!window.confirm("Are you sure you want to delete this assessment?")) return;
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments/${assessmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assessment");
    },
    onSuccess: (_, { moduleId }) => queryClient.invalidateQueries({ queryKey: ["course-content", "assessments", courseId, moduleId] }),
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to update course");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-content", "course", courseId] });
      setEditingCourseTitle(false);
    },
  });

  if (!courseId || courseLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white rounded-[30px] border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Course not found.</p>
        <Link to={`${staffBase}/course-content`} className="mt-4 inline-block text-primary font-medium hover:underline">
          Back to course content
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`${staffBase}/course-content`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-1">
          {editingCourseTitle ? (
            <div className="flex items-center gap-2 w-full max-w-xl">
              <input
                type="text"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-lg font-bold"
                autoFocus
              />
              <button
                onClick={() => updateCourseMutation.mutate(newCourseTitle)}
                disabled={!newCourseTitle.trim() || updateCourseMutation.isPending}
                className="bg-primary text-white px-3 py-1.5 rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {updateCourseMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingCourseTitle(false)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              {course.title}
              <button
                onClick={() => {
                  setNewCourseTitle(course.title);
                  setEditingCourseTitle(true);
                }}
                className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition-colors ml-2"
                title="Edit Course Title"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </h1>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4">{course.sector} · {course.duration}</p>

        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <p className="text-sm font-medium text-gray-900 mb-2">Course thumbnail (card image)</p>
          <p className="text-xs text-gray-600 mb-2">Shown on the Courses page as the card image. JPEG, PNG, or WebP; max 5MB.</p>
          <UploadCoverBlock
            courseId={courseId}
            getCourseContentApi={getCourseContentApi}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["course-content", "course", courseId] });
              queryClient.invalidateQueries({ queryKey: ["course-content", "courses"] });
            }}
            currentCoverUrl={course.coverImageUrl}
          />
        </div>
        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <p className="text-sm font-medium text-gray-900 mb-2">Upload document to this course</p>
          <p className="text-xs text-gray-600 mb-2">The file will be uploaded to Cloudinary and appear in course materials. PDF, Word, Excel, PowerPoint, or Text.</p>
          <UploadDocumentBlock courseId={courseId} getCourseContentApi={getCourseContentApi} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["course-content", "lessons-from-public", courseId] })} />
        </div>

        {modulesLoading ? (
          <p className="text-gray-500 text-sm">Loading modules…</p>
        ) : (
          <div className="space-y-3">
            {modules.map((mod) => (
              <ModuleBlock
                key={mod.id}
                courseId={courseId}
                staffBase={staffBase}
                module={mod}
                expanded={expandedModule === mod.id}
                onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                onAddLesson={() => setAddingLesson(mod.id)}
                editingLesson={editingLesson}
                onEditLesson={setEditingLesson}
                onCloseEditLesson={() => setEditingLesson(null)}
                updateLessonMutation={updateLessonMutation}
                addLessonMutation={addLessonMutation}
                addingLesson={addingLesson === mod.id}
                onCloseAddLesson={() => setAddingLesson(null)}
                addingAssessment={addingAssessment}
                setAddingAssessment={setAddingAssessment}
                queryClient={queryClient}
                deleteModuleMutation={deleteModuleMutation}
                deleteLessonMutation={deleteLessonMutation}
                deleteAssessmentMutation={deleteAssessmentMutation}
              />
            ))}

            {addingModule ? (
              <div className="flex items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Module title"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => addModuleMutation.mutate(newModuleTitle)}
                  disabled={!newModuleTitle.trim() || addModuleMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {addModuleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
                <button type="button" onClick={() => { setAddingModule(false); setNewModuleTitle(""); }} className="text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingModule(true)}
                className="flex items-center gap-2 w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-primary hover:text-primary font-medium"
              >
                <Plus className="w-5 h-5" /> Add module (subunit)
              </button>
            )}
          </div>
        )}
      </div>

      {editingLesson && (
        <LessonEditModal
          courseId={courseId}
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={(title, youtubeUrl, pdfUrl, contentHtml) =>
            updateLessonMutation.mutate({
              moduleId: editingLesson.moduleId,
              lessonId: editingLesson.id,
              title,
              youtubeUrl,
              pdfUrl,
              contentHtml,
            })
          }
          isSaving={updateLessonMutation.isPending}
        />
      )}
    </div>
  );
}

function ModuleBlock({
  courseId,
  staffBase,
  module: mod,
  expanded,
  onToggle,
  onAddLesson,
  editingLesson,
  onEditLesson,
  onCloseEditLesson,
  updateLessonMutation,
  addLessonMutation,
  addingLesson,
  onCloseAddLesson,
  addingAssessment,
  setAddingAssessment,
  queryClient,
  deleteModuleMutation,
  deleteLessonMutation,
  deleteAssessmentMutation,
}: {
  courseId: string;
  staffBase: string;
  module: ModuleDoc;
  expanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  editingLesson: LessonDoc | null;
  onEditLesson: (l: LessonDoc) => void;
  onCloseEditLesson: () => void;
  updateLessonMutation: ReturnType<typeof useMutation>;
  addLessonMutation: ReturnType<typeof useMutation>;
  addingLesson: boolean;
  onCloseAddLesson: () => void;
  addingAssessment: string | null;
  setAddingAssessment: (id: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  deleteModuleMutation: ReturnType<typeof useMutation>;
  deleteLessonMutation: ReturnType<typeof useMutation>;
  deleteAssessmentMutation: ReturnType<typeof useMutation>;
}) {
  const { data: lessons = [] } = useQuery({
    queryKey: ["course-content", "lessons", courseId, mod.id],
    queryFn: () => fetchLessons(courseId, mod.id),
    enabled: expanded,
  });
  const { data: assessments = [] } = useQuery({
    queryKey: ["course-content", "assessments", courseId, mod.id],
    queryFn: () => fetchAssessments(courseId, mod.id),
    enabled: expanded,
  });

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonYoutube, setNewLessonYoutube] = useState("");
  const [newLessonPdfFile, setNewLessonPdfFile] = useState<File | null>(null);
  const [newLessonContent, setNewLessonContent] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handleAddLesson = async () => {
    let pdfUrl: string | undefined;
    if (newLessonPdfFile) {
      const ext = "." + (newLessonPdfFile.name.split(".").pop()?.toLowerCase() ?? "");
      if (!isAllowedUploadExtension(ext)) {
        alert(`This file type is not allowed (got ${ext || "none"}).`);
        return;
      }
      setUploadingPdf(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => {
            const b64 = (r.result as string).split(",")[1];
            if (b64) resolve(b64); else reject(new Error("Failed"));
          };
          r.onerror = reject;
          r.readAsDataURL(newLessonPdfFile);
        });
        const res = await adminFetch(`${getApiBase()}/api/course-content/courses/${courseId}/upload-pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: newLessonPdfFile.name, contentBase64: base64 }),
        });
        if (!res.ok) throw new Error("File upload failed");
        const data = await res.json();
        pdfUrl = data.pdfUrl;
      } catch (err) {
        alert("Failed to upload file: " + (err as Error).message);
        setUploadingPdf(false);
        return;
      }
      setUploadingPdf(false);
    }
    
    addLessonMutation.mutate(
      { moduleId: mod.id, title: newLessonTitle, youtubeUrl: newLessonYoutube || undefined, pdfUrl, contentHtml: newLessonContent },
      {
        onSuccess: () => {
          setNewLessonTitle("");
          setNewLessonYoutube("");
          setNewLessonPdfFile(null);
          setNewLessonContent("");
          queryClient.invalidateQueries({ queryKey: ["course-content", "lessons", courseId, mod.id] });
        },
      }
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 group/mod">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          <span className="font-semibold text-gray-900">{mod.title}</span>
          <span className="text-sm text-gray-500">{lessons.length} lessons · {assessments.length} assessments</span>
        </button>
        {staffBase === "/admin" && (
          <button
            type="button"
            onClick={() => deleteModuleMutation.mutate(mod.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover/mod:opacity-100"
            title="Delete Module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Lessons & break points — add a quiz after any lesson to gate the next; learners must pass it before opening the next lesson. Quizzes are fully editable (title, questions, correct answers, placement).</p>
            <ul className="space-y-2 mb-3">
              {lessons.map((l, idx) => (
                <li key={l.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                       {l.pdfUrl ? <FileText className="w-4 h-4 text-amber-600 shrink-0" /> : null}
                      {l.youtubeUrl ? <Youtube className="w-4 h-4 text-red-600 shrink-0" /> : null}
                      {!l.pdfUrl && !l.youtubeUrl ? <FileText className="w-4 h-4 text-gray-400 shrink-0" /> : null}
                      <span className="truncate font-medium text-gray-900">{idx + 1}. {l.title}</span>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditLesson(l)}
                        className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      {staffBase === "/admin" && (
                        <button
                          type="button"
                          onClick={() => deleteLessonMutation.mutate({ moduleId: mod.id, lessonId: l.id })}
                          className="inline-flex items-center gap-1 text-red-600 text-sm font-medium hover:underline ml-4"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pl-4 flex items-center gap-2 flex-wrap">
                    {assessments.filter((a) => a.afterLessonId === l.id).map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">
                        <ClipboardList className="w-3 h-3" />
                        Break here: {a.title}
                        <Link to={`${staffBase}/course-content/${courseId}/modules/${mod.id}/assessments/${a.id}`} className="font-medium hover:underline">Edit</Link>
                        {staffBase === "/admin" && (
                          <button
                            type="button"
                            onClick={() => deleteAssessmentMutation.mutate({ moduleId: mod.id, assessmentId: a.id })}
                            className="font-medium text-red-600 hover:underline ml-1"
                          >Delete</button>
                        )}
                      </span>
                    ))}
                    {addingAssessment === `after-${l.id}` ? (
                      <AddAssessmentForm
                        courseId={courseId}
                        moduleId={mod.id}
                        afterLessonId={l.id}
                        order={idx + 1}
                        onClose={() => setAddingAssessment(null)}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ["course-content", "assessments", courseId, mod.id] });
                          setAddingAssessment(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingAssessment(`after-${l.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add break quiz after this lesson
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {addingLesson ? (
                <div className="space-y-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <h5 className="text-sm font-bold text-gray-900">New Lesson</h5>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="Title e.g., 1.1 Intro to Safety"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                    <input
                      type="url"
                      value={newLessonYoutube}
                      onChange={(e) => setNewLessonYoutube(e.target.value)}
                      placeholder="YouTube link (optional)"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                    <div className="space-y-1.5 ml-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documents/Materials (Optional)</label>
                      <input
                        type="file"
                        accept={FILE_INPUT_ACCEPT_ATTR}
                        onChange={(e) => setNewLessonPdfFile(e.target.files?.[0] ?? null)}
                        className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold file:cursor-pointer hover:file:bg-primary/20 transition-all"
                      />
                    </div>
                    <textarea
                      value={newLessonContent}
                      onChange={(e) => setNewLessonContent(e.target.value)}
                      placeholder="Lesson description or transcript..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddLesson}
                      disabled={!newLessonTitle.trim() || addLessonMutation.isPending || uploadingPdf}
                      className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-secondary disabled:opacity-50 transition-all shadow-md shadow-primary/10"
                    >
                      {addLessonMutation.isPending || uploadingPdf ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Lesson"}
                    </button>
                    <button type="button" onClick={onCloseAddLesson} className="px-4 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
            ) : (
              <button
                type="button"
                onClick={onAddLesson}
                className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
              >
                <Plus className="w-4 h-4" /> Add lesson
              </button>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Other assessments (end-of-module quizzes, no break placement)</p>
            {assessments.filter((a) => !a.afterLessonId).length > 0 ? (
              <ul className="space-y-2">
                {assessments.filter((a) => !a.afterLessonId).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white border border-gray-100">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      <span className="font-medium text-gray-900">{a.title}</span>
                      <span className="text-sm text-gray-500">({a.questions?.length ?? 0} questions)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`${staffBase}/course-content/${courseId}/modules/${mod.id}/assessments/${a.id}`}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Edit
                      </Link>
                      {staffBase === "/admin" && (
                        <button
                          type="button"
                          onClick={() => deleteAssessmentMutation.mutate({ moduleId: mod.id, assessmentId: a.id })}
                          className="text-red-600 text-sm font-medium hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No end-of-module quiz.</p>
            )}
            {addingAssessment === mod.id ? (
              <AddAssessmentForm
                courseId={courseId}
                moduleId={mod.id}
                onClose={() => setAddingAssessment(null)}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["course-content", "assessments", courseId, mod.id] });
                  setAddingAssessment(null);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingAssessment(mod.id)}
                className="mt-2 inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
              >
                <Plus className="w-4 h-4" /> Add quiz (end of module)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddAssessmentForm({
  courseId,
  moduleId,
  afterLessonId,
  order = 0,
  onClose,
  onSuccess,
}: {
  courseId: string;
  moduleId: string;
  afterLessonId?: string;
  order?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(afterLessonId ? "Break quiz" : "Module assessment");
  const [passThreshold, setPassThreshold] = useState(70);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          passThreshold,
          questions: [],
          order,
          ...(afterLessonId && { afterLessonId }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = (data as { detail?: string }).detail;
        throw new Error(detail ?? (data as { error?: string }).error ?? "Failed to create assessment");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-5 bg-gray-50/50 rounded-[24px] border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-6 bg-primary rounded-full" />
        <h4 className="font-bold text-gray-900">New Assessment</h4>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assessment Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Module 1 Break Quiz"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pass Threshold (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={passThreshold}
                onChange={(e) => setPassThreshold(Number(e.target.value))}
                className="flex-1 accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-12 text-center font-black text-primary bg-primary/10 py-1 rounded-lg text-sm">{passThreshold}%</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-xs font-bold pl-1">{error}</p>}
        
        <div className="flex items-center gap-3 pt-2">
          <button 
            type="submit" 
            disabled={saving} 
            className="flex-1 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-secondary transition-all disabled:opacity-50 shadow-md shadow-primary/10"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Assessment"}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function LessonEditModal({
  courseId,
  lesson,
  onClose,
  onSave,
  isSaving,
}: {
  courseId: string;
  lesson: LessonDoc;
  onClose: () => void;
  onSave: (title: string, youtubeUrl: string, pdfUrl: string, contentHtml: string) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [youtubeUrl, setYoutubeUrl] = useState(lesson.youtubeUrl ?? "");
  const [pdfUrl, setPdfUrl] = useState(lesson.pdfUrl ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [contentHtml, setContentHtml] = useState(lesson.contentHtml ?? "");

  const handleSave = async () => {
    let finalPdfUrl = pdfUrl;
    if (pdfFile) {
      const ext = "." + (pdfFile.name.split(".").pop()?.toLowerCase() ?? "");
      if (!isAllowedUploadExtension(ext)) {
        alert(`This file type is not allowed (got ${ext || "none"}).`);
        return;
      }
      setUploadingPdf(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => {
            const b64 = (r.result as string).split(",")[1];
            if (b64) resolve(b64); else reject(new Error("Failed"));
          };
          r.onerror = reject;
          r.readAsDataURL(pdfFile);
        });
        const res = await adminFetch(`${getApiBase()}/api/course-content/courses/${courseId}/upload-pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: pdfFile.name, contentBase64: base64 }),
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        finalPdfUrl = data.pdfUrl;
      } catch (err) {
        alert("Failed to upload file: " + (err as Error).message);
        setUploadingPdf(false);
        return;
      }
      setUploadingPdf(false);
    }
    onSave(title, youtubeUrl, finalPdfUrl, contentHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-[24px] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Edit lesson</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL (optional)</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documents/Materials (Optional)</label>
            {pdfUrl && !pdfFile && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm truncate max-w-[300px]" title={pdfUrl}>{pdfUrl.split('/').pop() || "Attached Document"}</span>
                <button type="button" onClick={() => setPdfUrl("")} className="text-red-500 hover:text-red-700 ml-auto p-1 text-sm font-medium" title="Remove Document">
                   Remove
                </button>
              </div>
            )}
            {!pdfUrl || pdfFile ? (
              <input
                type="file"
                accept={FILE_INPUT_ACCEPT_ATTR}
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-semibold file:cursor-pointer hover:file:bg-gray-200"
              />
            ) : null}
            <div className="text-xs text-gray-500 mt-1">Replace with a supported document, or remove the current file.</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Extra content (optional text)</label>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 resize-y"
              placeholder="Optional notes or summary."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || uploadingPdf}
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {isSaving || uploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
