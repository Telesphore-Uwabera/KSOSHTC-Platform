import { useEffect, useState } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, FileText, ExternalLink, ClipboardList, Lock, X, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";
import { CoursePdfJsViewer } from "../components/CoursePdfJsViewer";
import { getStoredUser, clearStoredUser } from "../lib/auth";
import { getApiBase } from "@/lib/apiBase";
import type { CourseDoc, ModuleDoc, LessonDoc, AssessmentDoc, ProgressDoc, EnrollmentDoc } from "@shared/api";
import { normalizeCloudinaryCourseUrl } from "@shared/normalizeCloudinaryUrl";
import { enrollmentAllowsLearnerAccess } from "@shared/learnerEnrollment";

const getCourseContentApi = () => getApiBase() + "/api/course-content";

async function ensureEnrolled(userId: string, courseId: string): Promise<void> {
  await fetch(`${getApiBase()}/api/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, courseId }),
  });
}

async function fetchCourse(courseId: string): Promise<CourseDoc | null> {
  const res = await fetch(`${getCourseContentApi()}/courses/${courseId}`);
  if (res.status === 404 || !res.ok) return null;
  return res.json();
}

async function fetchModules(courseId: string): Promise<ModuleDoc[]> {
  const res = await fetch(`${getCourseContentApi()}/courses/${courseId}/modules`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.modules ?? [];
}

// [REMOVED] fetchCoursesFromPublic and fetchLessonsFromPublic as they are legacy routes not present in backend

type ModuleItem = { type: "lesson"; data: LessonDoc } | { type: "assessment"; data: AssessmentDoc };

async function fetchModuleItems(courseId: string, moduleId: string): Promise<ModuleItem[]> {
  const res = await fetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/items`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

async function fetchLegacyQuiz(courseId: string) {
  const res = await fetch(`${getApiBase()}/api/courses/${courseId}/quiz`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchProgress(userId: string, courseId: string): Promise<ProgressDoc | null> {
  const res = await fetch(`${getApiBase()}/api/progress?userId=${encodeURIComponent(userId)}&courseId=${encodeURIComponent(courseId)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.progress ?? null;
}

async function fetchUserEnrollments(userId: string): Promise<EnrollmentDoc[]> {
  const res = await fetch(`${getApiBase()}/api/enrollments?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.enrollments ?? [];
}

async function markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<void> {
  await fetch(`${getApiBase()}/api/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, courseId, completedLessonId: lessonId }),
  });
}

function youtubeEmbedUrl(url: string): string {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

/** Strip " Copy", " Copy Copy", "CopyCopy" etc. from lesson titles for display. */
function cleanLessonTitle(title: string): string {
  return title.replace(/\s+Copy(\s*Copy)*\s*$/gi, "").replace(/\s+/g, " ").trim() || title;
}

/** Section label: "Section 1", "Section 2", ... (no NaN). */
function sectionLabel(sectionNumber: number): string {
  const n = Number(sectionNumber);
  return `Section ${Number.isFinite(n) && n >= 1 ? n : 1}`;
}

/** Strip all "Section N" and leading numbers so we show only one section (in green) + topic name. */
function stripSectionPrefix(title: string): string {
  let s = title
    .replace(/Section\s*\d+\s*/gi, "") // remove any "Section 2", "Section 3", etc.
    .replace(/^\d+\.\s*/, "")           // "1. " or "2. "
    .replace(/^\d+\s+/, "")             // "2 " or "8 " e.g. "2 Hazard Assessment" → "Hazard Assessment"
    .replace(/\s+/g, " ")
    .trim();
  return s || "";
}

const INITIAL_SECTION_CARDS = 6;
const SECTION_CARDS_STEP = 6;

/** Extension from Cloudinary URL path (e.g. `.docx`, `.pdf`). */
function extFromMaterialUrl(url: string): string {
  try {
    const pathPart = new URL(url.split("?")[0]).pathname;
    const seg = pathPart.split("/").pop() ?? "";
    const m = seg.match(/(\.[a-z0-9]{2,8})$/i);
    return m ? m[1].toLowerCase() : "";
  } catch {
    return "";
  }
}

function streamFilenameForLesson(cloudinaryUrl: string, displayTitle: string): string {
  const ext = extFromMaterialUrl(cloudinaryUrl);
  const stem = (displayTitle.trim() || "Lesson")
    .replace(/[\\/]/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 120);
  return `${stem}${ext || ".pdf"}`;
}

/**
 * Cloudinary course files (raw or image delivery) often omit a clear extension in the URL.
 * Proxy through our API for inline viewing, correct MIME, and optional explicit download.
 */
function courseDocumentViewerSrc(pdfUrl: string, displayTitle: string): string {
  const base = getApiBase().replace(/\/$/, "");
  const trimmed = normalizeCloudinaryCourseUrl(pdfUrl);
  if (!trimmed) return "";
  const absolute = trimmed.startsWith("http")
    ? trimmed
    : `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;

  const isCloudinaryCourse =
    absolute.includes("res.cloudinary.com") &&
    absolute.includes("/ksohtc/courses/") &&
    (absolute.includes("/raw/upload/") || absolute.includes("/image/upload/"));

  if (isCloudinaryCourse) {
    const name = streamFilenameForLesson(absolute, displayTitle);
    const q = new URLSearchParams({ url: absolute, filename: name });
    return `${base}/api/course-content/stream-document?${q.toString()}`;
  }
  return absolute;
}

/** Full-screen modal to read PDF inline. Resolves PDF path by title when courseId is set (fixes bad stored paths). */
function PdfViewerModal({
  pdfUrl: initialPdfUrl,
  title,
  courseId,
  onClose,
}: {
  pdfUrl: string;
  title: string;
  courseId?: string;
  onClose: () => void;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!courseId);

  useEffect(() => {
    if (!courseId || !title?.trim() || initialPdfUrl.startsWith("http")) {
      setLoading(false);
      return;
    }
    const q = new URLSearchParams({ title: title.trim() });
    fetch(`${getApiBase()}/api/course-content/courses/${encodeURIComponent(courseId)}/resolve-pdf?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { pdfUrl?: string } | null) => {
        if (data?.pdfUrl) setResolvedUrl(data.pdfUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, title, initialPdfUrl]);

  const pdfUrl = normalizeCloudinaryCourseUrl((resolvedUrl ?? initialPdfUrl).trim());
  const documentSrc = pdfUrl ? courseDocumentViewerSrc(pdfUrl, title) : "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label="PDF viewer">
      <div className="flex items-center justify-between gap-4 shrink-0 px-4 py-2 bg-gray-900 text-white">
        <span className="font-medium truncate text-sm">{title}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <p className="sr-only">
        PDFs open in the viewer below. Websites cannot block operating-system screenshots or screen recording.
      </p>
      <div
        className="flex-1 min-h-0 p-2 select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitUserSelect: "none" as const }}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white/80">Loading PDF…</div>
        ) : documentSrc ? (
          <CoursePdfJsViewer fileUrl={documentSrc} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/80 px-6 text-center">
            No PDF found for this lesson yet.
          </div>
        )}
      </div>
    </div>
  );
}

/** One card per PDF/lesson – used when expanding "Section 99" so each PDF is its own section. */
function SingleLessonCard({
  number,
  courseId,
  moduleId,
  lesson,
  unlocked,
  completed,
  onMarkComplete,
  onViewPdf,
}: {
  number: number;
  courseId: string;
  moduleId: string;
  lesson: LessonDoc;
  unlocked: boolean;
  completed: boolean;
  onMarkComplete: () => void;
  onViewPdf: (url: string, title: string) => void;
}) {
  const rawTitle = cleanLessonTitle(lesson.title);
  const title = stripSectionPrefix(rawTitle);
  const section = sectionLabel(number);
  return (
    <article className="flex flex-col min-h-[100px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden">
      <h2 className="text-sm font-bold text-primary mb-0.5 flex items-center gap-1.5 shrink-0">
        <FileText className="w-3.5 h-3.5 shrink-0" />
        {section}
      </h2>
      {title ? <span className="text-xs text-gray-700 line-clamp-2 mb-1.5">{title}</span> : null}
      <>
        {unlocked ? (
          <div className="flex flex-wrap items-center gap-2 mt-auto">
            <button
              type="button"
              onClick={() => {
                if (!completed) onMarkComplete();
                onViewPdf(lesson.pdfUrl ?? "", `${section} – ${title}`);
              }}
              className="inline-flex items-center gap-1.5 text-primary hover:text-accent font-medium text-xs underline underline-offset-1"
            >
              Open file
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 text-gray-500 text-xs mt-auto">
            <Lock className="w-3.5 h-3.5" />
            Complete the break quiz above to unlock.
          </p>
        )}
      </>
    </article>
  );
}

/** Compact quiz card when Section 99 is expanded (one card per lesson). */
function AssessmentCard({
  number,
  courseId,
  moduleId,
  assessment,
  passed,
}: {
  number: number;
  courseId: string;
  moduleId: string;
  assessment: AssessmentDoc;
  passed: boolean;
}) {
  const section = sectionLabel(number);
  return (
    <article className="flex flex-col min-h-[80px] rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-sm">
      <div className="flex items-center gap-1.5 flex-wrap">
        <ClipboardList className="w-4 h-4 text-primary shrink-0" />
        <span className="font-medium text-gray-900 text-xs">{section}</span>
        <span className="text-gray-600 text-xs truncate"> – {assessment.title}</span>
        {passed && <span className="text-xs text-green-700 ml-1">(passed)</span>}
        {!passed && (
          <Link
            to={`/courses/${courseId}/modules/${moduleId}/quiz/${assessment.id}`}
            className="ml-auto inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 text-xs"
          >
            Take quiz
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

function ModuleBlock({
  number,
  courseId,
  module: mod,
  progress,
  userId,
  onProgressUpdate,
  onViewPdf,
}: {
  number: number;
  courseId: string;
  module: ModuleDoc;
  progress: ProgressDoc | null;
  userId: string;
  onProgressUpdate: () => void;
  onViewPdf: (url: string, title: string) => void;
}) {
  const { data: items = [] } = useQuery({
    queryKey: ["course-content", "items", courseId, mod.id],
    queryFn: () => fetchModuleItems(courseId, mod.id),
  });
  const completedLessons = new Set(progress?.completedLessonIds ?? []);
  const completedAssessments = new Set(progress?.completedAssessmentIds ?? []);

  const markCompleteMutation = useMutation({
    mutationFn: (lessonId: string) => markLessonComplete(userId, courseId, lessonId),
    onSuccess: () => onProgressUpdate(),
  });

  function isLessonUnlocked(itemIndex: number): boolean {
    for (let i = 0; i < itemIndex; i++) {
      const prev = items[i];
      if (prev.type === "assessment" && !completedAssessments.has(prev.data.id)) return false;
    }
    return true;
  }

  const section = sectionLabel(number);
  const title = stripSectionPrefix(mod.title);

  return (
    <article className="flex flex-col min-h-[180px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden">
      <h2 className="text-sm font-bold text-primary mb-0.5 flex items-center gap-1.5 shrink-0">
        <FileText className="w-3.5 h-3.5 shrink-0" />
        {section}
      </h2>
      {title ? <span className="text-xs text-gray-700 mb-2">{title}</span> : null}
      <ul className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
        {items.map((item, itemIndex) => {
          if (item.type === "lesson") {
            const lesson = item.data;
            const unlocked = isLessonUnlocked(itemIndex);
            const lessonTitle = stripSectionPrefix(cleanLessonTitle(lesson.title));

            return (
              <li key={`lesson-${lesson.id}`} className="flex flex-col gap-1">
                <span className="font-medium text-gray-900 text-xs">{lessonTitle}</span>
                {lesson.youtubeUrl && (
                  <div className="rounded-lg overflow-hidden bg-gray-100 aspect-video max-w-2xl">
                    <iframe
                      title={lesson.title}
                      src={youtubeEmbedUrl(lesson.youtubeUrl)}
                      className="w-full h-full"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}
                <>
                  {unlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!completedLessons.has(lesson.id)) markCompleteMutation.mutate(lesson.id);
                        onViewPdf(lesson.pdfUrl ?? "", lessonTitle);
                      }}
                      className="inline-flex items-center gap-1.5 text-primary hover:text-accent font-medium text-xs underline underline-offset-1 text-left"
                    >
                      Open file
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <p className="inline-flex items-center gap-2 text-gray-500 text-sm">
                      <Lock className="w-4 h-4" />
                      Complete the break quiz above to unlock this file.
                    </p>
                  )}
                </>
                {lesson.contentHtml && (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
                  />
                )}
              </li>
            );
          }
          const assessment = item.data;
          const passed = completedAssessments.has(assessment.id);
          return (
            <li key={`assessment-${assessment.id}`} className="pt-1">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-gray-900 text-xs">{assessment.title}</span>
                {passed && <span className="text-sm text-green-700">(passed)</span>}
                {!passed && (
                  <Link
                    to={`/courses/${courseId}/modules/${mod.id}/quiz/${assessment.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 text-xs"
                  >
                    Take break quiz
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

const SECTOR_LABELS: Record<string, string> = {
  construction: "Construction",
  "industrial-safety": "Industrial Safety",
  mining: "Mining",
};

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = getStoredUser();
  const canAccess = user?.approved ?? false;

  if (!user) return <Navigate to="/login" replace state={{ from: `/courses/${courseId ?? ""}` }} />;

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course-content", "course", courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => fetchUserEnrollments(user?.id || ""),
    enabled: !!user?.id && canAccess,
  });

  const displayCourse = course; // [FIXED] Removed fallback to coursesFromPublic

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["course-content", "modules", courseId],
    queryFn: () => fetchModules(courseId!),
    enabled: !!courseId && !!displayCourse,
  });

  const lessonsFromPublic: any[] = []; // [REMOVED] Legacy local lesson lookup

  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ["progress", user?.id, courseId],
    queryFn: () => fetchProgress(user?.id || "", courseId!),
    enabled: !!user?.id && !!courseId && canAccess && !!displayCourse,
  });

  const section99Module = modules.find((m) => m.title.includes("Section 99"));
  const { data: section99Items = [] } = useQuery({
    queryKey: ["course-content", "items", courseId, section99Module?.id],
    queryFn: () => fetchModuleItems(courseId!, section99Module!.id),
    enabled: !!courseId && !!section99Module?.id,
  });
  const completedLessons = new Set(progress?.completedLessonIds ?? []);
  const completedAssessments = new Set(progress?.completedAssessmentIds ?? []);
  function isLessonUnlockedInSection99(itemIndex: number): boolean {
    for (let i = 0; i < itemIndex; i++) {
      const prev = section99Items[i];
      if (prev?.type === "assessment" && !completedAssessments.has(prev.data.id)) return false;
    }
    return true;
  }

  const { data: legacyQuiz } = useQuery({
    queryKey: ["quiz", courseId],
    queryFn: () => fetchLegacyQuiz(courseId!),
    enabled: !!courseId && canAccess,
  });

  const enrollMutation = useMutation({
    mutationFn: () => ensureEnrolled(user?.id || "", courseId!),
  });
  const markCompleteMutation = useMutation({
    mutationFn: (lessonId: string) => markLessonComplete(user?.id || "", courseId!, lessonId),
    onSuccess: () => refetchProgress(),
  });

  const [visibleSectionCount, setVisibleSectionCount] = useState(INITIAL_SECTION_CARDS);
  const [visiblePublicLessonsCount, setVisiblePublicLessonsCount] = useState(INITIAL_SECTION_CARDS);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);

  function openPdfViewer(url: string, title: string) {
    if (!url?.trim()) return;
    const trimmed = normalizeCloudinaryCourseUrl(url.trim());
    const ext = extFromMaterialUrl(trimmed);
    const treatAsPdf = ext === ".pdf" || ext === "";
    if (treatAsPdf) {
      setPdfViewer({ url, title });
      return;
    }
    const src = courseDocumentViewerSrc(trimmed, title);
    if (src) window.open(src, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    if (canAccess && user?.id && courseId) enrollMutation.mutate();
  }, [canAccess, user?.id, courseId]);

  if (!courseId) return <Navigate to="/dashboard" replace />;
  if (courseLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28 sm:h-32" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-gray-600">Loading course…</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (!displayCourse) return <Navigate to="/dashboard" replace />;

  const enrollmentForThisCourse = myEnrollments.find((e) => e.courseId === courseId);
  const enrollmentAllowsAccess = Boolean(
    enrollmentForThisCourse && enrollmentAllowsLearnerAccess(enrollmentForThisCourse.status)
  );

  if (
    canAccess &&
    enrollmentForThisCourse &&
    !enrollmentAllowsLearnerAccess(enrollmentForThisCourse.status) &&
    enrollmentForThisCourse.status === "not_approved"
  ) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="h-28" aria-hidden="true" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 text-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="enrollment-pending-title"
          >
            <div className="flex justify-center mb-4">
              <span className="inline-flex w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </span>
            </div>
            <h2 id="enrollment-pending-title" className="text-lg font-bold text-gray-900 mb-2">
              Course access pending
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              This course was added to your account, but your enrollment is not active yet. It will appear on your dashboard once an administrator approves access.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/dashboard", { replace: true })}
                className="px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to my dashboard
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    canAccess &&
    enrollmentForThisCourse &&
    !enrollmentAllowsLearnerAccess(enrollmentForThisCourse.status) &&
    enrollmentForThisCourse.status !== "not_approved"
  ) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="h-28" aria-hidden="true" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 text-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="enrollment-inactive-title"
          >
            <div className="flex justify-center mb-4">
              <span className="inline-flex w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </span>
            </div>
            <h2 id="enrollment-inactive-title" className="text-lg font-bold text-gray-900 mb-2">
              This course is not available on your account
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Your access to this course is not active. It will reappear on your dashboard if an administrator restores your enrollment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/dashboard", { replace: true })}
                className="px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to my dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    canAccess &&
    !enrollmentAllowsAccess &&
    user?.sector &&
    courseId !== "safety-management" &&
    courseId !== user.sector
  ) {
    const sectorLabel = SECTOR_LABELS[user.sector] ?? user.sector;
    const message = `You are registered for ${sectorLabel}. Please join ${sectorLabel} courses from your dashboard. As an approved learner you can also join Safety Management (General).`;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="h-28" aria-hidden="true" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 text-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sector-mismatch-title"
          >
            <div className="flex justify-center mb-4">
              <span className="inline-flex w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </span>
            </div>
            <h2 id="sector-mismatch-title" className="text-lg font-bold text-gray-900 mb-2">
              This course is not available for your registration
            </h2>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/dashboard", { replace: true })}
                className="px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to my dashboard
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="relative text-white py-12 sm:py-16 min-h-[30vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <SiteImage
            src="/ksohtc-3.webp"
            alt=""
            hero
            priority
            className="w-full h-full object-cover hero-zoom bg-image-animate bg-image-move-endless"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-secondary/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{displayCourse.title}</h1>
          <p className="text-white/90 mt-1">{displayCourse.sector} · {displayCourse.duration}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!canAccess ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900">
              <p className="font-semibold">Registration under review</p>
              <p className="mt-2">
                Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to view course materials once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 border-2 border-primary text-primary font-bold py-2 px-4 rounded-lg hover:bg-primary/10"
                >
                  Back to dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { clearStoredUser(); window.location.href = "/login"; }}
                  className="inline-flex items-center gap-2 text-amber-800 font-semibold hover:text-amber-900"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-10">{displayCourse.description ?? ""}</p>

              {modulesLoading ? (
                <p className="text-gray-600">Loading modules…</p>
              ) : modules.length > 0 ? (
                <>
                  {(() => {
                    const allSectionCards: React.ReactNode[] = [];
                    let cardNumber = 0;
                    for (const mod of modules) {
                      if (mod.title === "Safety Management (General)") {
                        cardNumber++;
                        allSectionCards.push(
                          <Link
                            key={mod.id}
                            to="/courses/safety-management"
                            className="flex flex-col min-h-[120px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                          >
                            <h2 className="text-sm font-bold text-primary flex items-center gap-2 mb-0.5">
                              <FileText className="w-4 h-4 shrink-0" />
                              {sectionLabel(cardNumber)}
                            </h2>
                            <span className="text-xs text-gray-700 mb-2">{stripSectionPrefix(mod.title)}</span>
                            <span className="text-primary font-semibold text-sm mt-auto inline-flex items-center gap-1">
                              Go to Safety Management course
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          </Link>
                        );
                      } else if (mod.title.includes("Section 99") && section99Module?.id === mod.id) {
                        section99Items.forEach((item, itemIndex) => {
                          cardNumber++;
                          if (item.type === "lesson") {
                            const lesson = item.data;
                            allSectionCards.push(
                              <SingleLessonCard
                                key={`lesson-${lesson.id}`}
                                number={cardNumber}
                                courseId={courseId!}
                                moduleId={mod.id}
                                lesson={lesson}
                                unlocked={isLessonUnlockedInSection99(itemIndex)}
                                completed={completedLessons.has(lesson.id)}
                                onMarkComplete={() => markCompleteMutation.mutate(lesson.id)}
                                onViewPdf={openPdfViewer}
                              />
                            );
                          } else {
                            allSectionCards.push(
                              <AssessmentCard
                                key={`assessment-${item.data.id}`}
                                number={cardNumber}
                                courseId={courseId!}
                                moduleId={mod.id}
                                assessment={item.data}
                                passed={completedAssessments.has(item.data.id)}
                              />
                            );
                          }
                        });
                      } else {
                        cardNumber++;
                        allSectionCards.push(
                          <ModuleBlock
                            key={mod.id}
                            number={cardNumber}
                            courseId={courseId!}
                            module={mod}
                            progress={progress ?? null}
                            userId={user!.id}
                            onProgressUpdate={() => refetchProgress()}
                            onViewPdf={openPdfViewer}
                          />
                        );
                      }
                    }
                    const visibleCards = allSectionCards.slice(0, visibleSectionCount);
                    const hasMore = allSectionCards.length > INITIAL_SECTION_CARDS;
                    const canShowMore = visibleSectionCount < allSectionCards.length;
                    const canShowLess = visibleSectionCount > INITIAL_SECTION_CARDS;

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                          {visibleCards}
                        </div>
                        {hasMore && (
                          <div className="flex flex-wrap items-center gap-3 mt-6">
                            {canShowMore && (
                              <button
                                type="button"
                                onClick={() => setVisibleSectionCount((c) => c + SECTION_CARDS_STEP)}
                                className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:text-accent transition-colors"
                              >
                                View more
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                            {canShowLess && (
                              <button
                                type="button"
                                onClick={() => setVisibleSectionCount(INITIAL_SECTION_CARDS)}
                                className="inline-flex items-center gap-2 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors"
                              >
                                View less
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {legacyQuiz && (
                    <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Course quiz
                      </h2>
                      <p className="text-gray-600 text-sm mb-3">
                        {legacyQuiz.description || "Test your knowledge after completing the materials."}
                      </p>
                      <Link
                        to={`/courses/${courseId}/quiz/take`}
                        className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90"
                      >
                        Take course quiz
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600 py-8">
                  No materials yet. Run the seed from Admin → Course content to create modules and lessons from your PDFs, or add content manually.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {pdfViewer && (
        <PdfViewerModal
          pdfUrl={pdfViewer.url}
          title={pdfViewer.title}
          courseId={courseId ?? undefined}
          onClose={() => setPdfViewer(null)}
        />
      )}

      <Footer />
    </div>
  );
}
