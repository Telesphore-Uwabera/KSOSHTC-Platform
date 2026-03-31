import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardList, Edit, Plus } from "lucide-react";
import type { CoursePublic } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

async function fetchCourses(): Promise<CoursePublic[]> {
  const res = await adminFetch(getApiBase() + "/api/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data as { courses: CoursePublic[] }).courses ?? [];
}

async function fetchQuizExists(courseId: string): Promise<boolean> {
  const res = await adminFetch(getApiBase() + `/api/courses/${courseId}/quiz`);
  return res.ok;
}

function CourseRow({ course }: { course: CoursePublic }) {
  const { data: hasQuiz } = useQuery({
    queryKey: ["quiz-exists", course.id],
    queryFn: () => fetchQuizExists(course.id),
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-semibold text-gray-900">{course.title}</p>
        <p className="text-sm text-gray-500">{course.sector} · {course.duration}</p>
      </div>
      <Link
        to={`/admin/courses/${course.id}/quiz`}
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90"
      >
        {hasQuiz ? (
          <>
            <Edit className="w-4 h-4" />
            Edit quiz
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Set quiz
          </>
        )}
      </Link>
    </li>
  );
}

export default function AdminCourses() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  return (
    <div className="bg-white rounded-[30px] shadow-lg border border-gray-200 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
        <ClipboardList className="w-5 h-5" />
        Courses & assessments
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Set a quiz or assessment for each course. Participants will see it after the course materials.
      </p>
      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading courses…</p>
      ) : (
        <ul>
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </ul>
      )}
    </div>
  );
}
