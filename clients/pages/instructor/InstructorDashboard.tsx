import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardList, ExternalLink, FileSpreadsheet, FolderOpen, Loader2 } from "lucide-react";
import type { AdminDistributedAssignmentDoc, CourseDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

function buildStreamUrl(fileUrl: string, filename: string): string {
  const base = getApiBase();
  const q = new URLSearchParams();
  q.set("url", fileUrl);
  q.set("filename", filename);
  return `${base}/api/course-content/stream-document?${q.toString()}`;
}

async function fetchAssignmentsForMyCourses(): Promise<AdminDistributedAssignmentDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/admin-distributed-assignments");
  if (!res.ok) throw new Error("Failed to load assignments");
  const data = await res.json();
  return (data.assignments ?? []) as AdminDistributedAssignmentDoc[];
}

async function fetchMyCourses(): Promise<CourseDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return ((data.courses ?? []) as CourseDoc[]).filter((c) => c.published !== false);
}

export default function InstructorDashboard() {
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["instructor", "course-distributed-assignments"],
    queryFn: fetchAssignmentsForMyCourses,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["instructor", "courses"],
    queryFn: fetchMyCourses,
  });

  const latestAssignments = useMemo(() => assignments.slice(0, 5), [assignments]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Instructor dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base mt-2">
          Your dashboard shows only your assigned courses and the assignments shared for those courses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            My assigned courses
          </p>
          {coursesLoading ? (
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
              <Link to="/instructor/course-content" className="text-sm font-semibold text-primary hover:underline mt-2 inline-block">
                Open course content
              </Link>
            </>
          )}
        </div>

        <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            Assignments for my courses
          </p>
          {assignmentsLoading ? (
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
              <Link to="/instructor/distribute-pdf" className="text-sm font-semibold text-primary hover:underline mt-2 inline-block">
                Open distribute files
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Latest assignments for my courses
        </h2>
        {assignmentsLoading ? (
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </p>
        ) : latestAssignments.length === 0 ? (
          <p className="text-gray-600 text-sm">No assignments shared for your courses yet.</p>
        ) : (
          <ul className="space-y-2">
            {latestAssignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <span className="font-medium text-gray-800 truncate min-w-0">{a.title}</span>
                <a
                  href={buildStreamUrl(a.pdfUrl, a.originalFilename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary font-semibold shrink-0"
                >
                  Open file <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

