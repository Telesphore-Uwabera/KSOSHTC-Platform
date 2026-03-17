import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, HardHat, Building, Pickaxe, Shield, Percent } from "lucide-react";
import { useDashboardData } from "./dashboardData";

const iconBySlug: Record<string, typeof HardHat> = {
  construction: HardHat,
  "industrial-safety": Building,
  mining: Pickaxe,
  "safety-management": Shield,
  "safety-for-all": Shield,
};

export default function DashboardCourses() {
  const { canAccess, courses, progressByCourse, statsByCourse, rows, isLoading, statsLoading, error } = useDashboardData();

  if (!canAccess) {
    return (
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-2">Registration under review</h2>
        <p className="text-gray-600">
          Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to access your courses once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
        </p>
        <Link to="/courses" className="text-primary font-medium mt-4 inline-block">View courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          My courses
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-1">
          Take a course below to view materials and mark lessons as done. Progress updates when you return.
        </p>

        {!isLoading && !error && courses.length > 0 && (
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => {
              const Icon = iconBySlug[course.slug ?? course.id] ?? BookOpen;
              const progress = progressByCourse[course.id];
              const stats = statsByCourse[course.id] ?? { totalLessons: 0, totalAssessments: 0 };
              const completed = (progress?.completedLessonIds?.length ?? 0) + (progress?.completedAssessmentIds?.length ?? 0);
              const total = stats.totalLessons + stats.totalAssessments;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-primary/30 hover:shadow-md transition-all text-left"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </span>
                  <p className="font-semibold text-gray-900 truncate">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.sector} · {course.duration}</p>
                  <p className="text-sm text-primary font-medium mt-auto">
                    {completed} / {total} complete ({pct}%)
                  </p>
                  <span className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                    View materials & mark done
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Course progress
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Per-course breakdown. Mark lessons as done from each course page; numbers update when you return.
        </p>
        {isLoading || statsLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : error ? (
          <p className="text-red-600 text-sm">Could not load courses.</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-600">No courses available yet. Check back later.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4 font-semibold">Course</th>
                  <th className="py-2 pr-4 font-semibold">Lessons</th>
                  <th className="py-2 pr-4 font-semibold">Quizzes passed</th>
                  <th className="py-2 font-semibold flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" /> Completion
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.course.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        to={`/courses/${row.course.id}`}
                        className="font-medium text-primary hover:text-secondary"
                      >
                        {row.course.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-gray-900">
                      {row.completedLessons} / {row.totalLessons}
                    </td>
                    <td className="py-3 pr-4 text-gray-900">
                      {row.passedQuizzes} / {row.totalAssessments}
                    </td>
                    <td className="py-3 text-gray-900">{row.completionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-500">
          All course access is from this dashboard. Open a course above to view materials and track progress.
        </p>
      </div>
    </div>
  );
}
