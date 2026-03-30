import { Link } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  HardHat,
  Building,
  Pickaxe,
  Shield,
  BarChart3,
  Tag,
  BookOpenCheck,
  ClipboardCheck,
} from "lucide-react";
import { useDashboardData, SECTOR_LABELS } from "./dashboardData";

const iconBySlug: Record<string, typeof HardHat> = {
  construction: HardHat,
  "industrial-safety": Building,
  mining: Pickaxe,
  "safety-management": Shield,
  "safety-for-all": Shield,
};

export default function Dashboard() {
  const {
    user,
    canAccess,
    courses,
    progressByCourse,
    statsByCourse,
    kpis,
    rows,
    isLoading,
    statsLoading,
    error,
  } = useDashboardData();

  if (!canAccess) {
    return (
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-2">Registration under review</h2>
        <p className="text-gray-600">
          Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to access your dashboard and courses once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
        </p>
        <Link to="/courses" className="text-primary font-medium mt-4 inline-block">View courses</Link>
      </div>
    );
  }

  const categoryLabel = user?.sector ? (SECTOR_LABELS[user.sector] ?? user.sector) : "All categories";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Overview
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <Tag className="w-4 h-4 text-primary" />
            Your category:
          </span>
          <span className="font-semibold text-primary">{categoryLabel}</span>
        </div>
        <p className="text-gray-600 text-sm mb-6">
          {user?.sector
            ? "You see only courses for your sector (and General). Open a course in My courses to view materials and mark lessons as done."
            : "Open a course in My courses to view materials and track progress."}
        </p>

        {isLoading ? (
          <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-48 border border-gray-100" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-10">
            <p className="text-red-700 font-semibold">Failed to load courses</p>
            <p className="text-red-600 text-sm mt-1">Please check your internet connection and refresh the page.</p>
          </div>
        ) : courses.length > 0 ? (
          <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 mb-10">
            {rows.map((row) => {
              const { course, completionPercent, latestPerformance } = row;
              const Icon = iconBySlug[course.slug ?? course.id] ?? BookOpen;
              return (
                <div
                  key={course.id}
                  className="flex flex-col gap-3 p-5 rounded-2xl border border-gray-200 bg-gray-50 hover:border-primary/30 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </span>
                    <Link to={`/courses/${course.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 line-clamp-1">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.sector} · {course.duration}</p>
                  </div>
                  
                  <div className="space-y-1.5 mt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span>Progress</span>
                      <span className="text-primary">{completionPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500 ease-out" 
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {latestPerformance ? (
                    <div className={`mt-auto p-2 rounded-lg border flex items-center gap-2 ${
                      latestPerformance.passed 
                        ? "bg-green-50 border-green-100 text-green-700" 
                        : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${latestPerformance.passed ? "bg-green-500" : "bg-amber-500"}`} />
                      <p className="text-[11px] font-semibold leading-tight">
                        Last quiz: {latestPerformance.score}/{latestPerformance.maxScore} ({latestPerformance.percentage}%) {latestPerformance.passed ? "PASSED" : "RETRY"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-auto p-2 rounded-lg border border-dashed border-gray-200 bg-white text-gray-400">
                      <p className="text-[11px] italic leading-tight">No quizzes taken yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-10 text-center mb-10">
            <p className="text-gray-500 font-medium">No courses available in this category yet.</p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">Quick stats</p>
          <p className="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              {statsLoading ? "…" : kpis.completedSections} sections completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpenCheck className="w-4 h-4 text-primary" />
              {statsLoading ? "…" : kpis.passedQuizzes} quizzes passed
            </span>
            <span className="font-semibold text-primary">
              {statsLoading ? "…" : `${kpis.overallPercent}%`} overall
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/courses"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            My courses
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard/progress"
            className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2.5 px-5 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View progress
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}