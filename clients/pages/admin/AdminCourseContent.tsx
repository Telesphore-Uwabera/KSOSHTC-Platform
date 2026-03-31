import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, FolderOpen, Loader2 } from "lucide-react";
import type { CourseDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

async function fetchCourseContent(): Promise<CourseDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data as { courses: CourseDoc[] }).courses ?? [];
}

export default function AdminCourseContent() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["course-content", "courses"],
    queryFn: fetchCourseContent,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2 mb-2">
              <FolderOpen className="w-6 h-6" />
              Course content
            </h1>
            <p className="text-gray-600 text-sm">
              Manage course structure: modules, lessons (Cloudinary PDFs, YouTube, text), and break quizzes.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading courses…</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900">
            <p className="font-medium mb-1">No courses found</p>
            <p className="text-sm text-amber-800/90">
              Create your first course to begin adding content.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/course-content/${c.id}`}
                  className="flex items-center justify-between gap-3 p-4 h-full rounded-2xl border border-gray-200 hover:border-primary/40 hover:bg-gray-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{c.title}</p>
                      <p className="text-sm text-gray-500 truncate">{c.sector} · {c.duration}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
