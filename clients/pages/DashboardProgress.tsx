import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpenCheck,
  Percent,
  ClipboardCheck,
  HelpCircle,
} from "lucide-react";
import { useDashboardData } from "./dashboardData";

export default function DashboardProgress() {
  const { canAccess, kpis, statsLoading } = useDashboardData();

  if (!canAccess) {
    return (
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-2">Registration under review</h2>
        <p className="text-gray-600">
          Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to see your progress once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
        </p>
        <Link to="/courses" className="text-primary font-medium mt-4 inline-block">View courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Progress
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Your progress across courses: completed sections, passed quizzes, and completion percentage.
            </p>
          </div>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Completed sections</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              {statsLoading ? "…" : kpis.completedSections}
            </p>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              Lessons + quizzes completed
            </p>
          </div>
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Lessons completed</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              {statsLoading ? "…" : kpis.completedLessons}
            </p>
            <p className="text-sm text-gray-600 mt-1">Sections you’ve finished</p>
          </div>
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Passed quizzes</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              {statsLoading ? "…" : kpis.passedQuizzes}
            </p>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-primary" />
              Assessments passed
            </p>
          </div>
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Overall completion</p>
            <p className="text-3xl font-extrabold text-primary mt-1">
              {statsLoading ? "…" : `${kpis.overallPercent}%`}
            </p>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              Across all courses
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            How we calculate your progress
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li><strong>Completed sections</strong> = number of lessons you’ve completed plus quizzes you’ve passed.</li>
            <li><strong>Completion %</strong> = (lessons completed + quizzes passed) ÷ (total lessons + total quizzes in that course) × 100.</li>
            <li><strong>Overall completion</strong> = same formula across all your courses (total completed steps ÷ total steps).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
