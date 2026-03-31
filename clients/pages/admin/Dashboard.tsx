import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, BarChart3, TrendingUp, ShieldCheck, MessageSquareQuote, BookOpenCheck, BookOpen, Percent } from "lucide-react";
import type { CoursePublic, CourseUsageItem, Testimonial, UserPublic } from "@shared/api";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

async function fetchCourseUsage(): Promise<CourseUsageItem[]> {
  const res = await adminFetch(getApiBase() + "/api/analytics/course-usage");
  if (!res.ok) throw new Error("Failed to load course usage");
  const data = await res.json();
  return (data as { courseUsage: CourseUsageItem[] }).courseUsage ?? [];
}

async function fetchUsers(): Promise<UserPublic[]> {
  const res = await adminFetch(getApiBase() + "/api/users");
  if (!res.ok) throw new Error("Failed to load users");
  const data = await res.json();
  return (data as { users: UserPublic[] }).users ?? [];
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await adminFetch(getApiBase() + "/api/testimonials");
  if (!res.ok) throw new Error("Failed to load testimonials");
  return res.json();
}

async function fetchCourses(): Promise<CoursePublic[]> {
  const res = await adminFetch(getApiBase() + "/api/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data as { courses: CoursePublic[] }).courses ?? [];
}

async function fetchQuizConfiguredCount(courses: CoursePublic[]): Promise<number> {
  const results = await Promise.all(
    courses.map(async (c) => {
      const res = await adminFetch(getApiBase() + `/api/courses/${c.id}/quiz`);
      if (!res.ok) return 0;
      const data = await res.json().catch(() => null);
      return data && typeof data === "object" ? 1 : 0;
    })
  );
  return results.reduce((a, b) => a + b, 0);
}

function fmtDay(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
  });
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });
  const { data: quizConfiguredCount = 0, isLoading: quizCountLoading } = useQuery({
    queryKey: ["quizConfiguredCount", courses.map((c) => c.id).join("|")],
    queryFn: () => fetchQuizConfiguredCount(courses),
    enabled: courses.length > 0,
  });
  const { data: courseUsage = [], isLoading: courseUsageLoading } = useQuery({
    queryKey: ["analytics", "course-usage"],
    queryFn: fetchCourseUsage,
  });

  const stats = useMemo(() => {
    const total = users.length;
    const approved = users.filter((u) => u.approved).length;
    const pending = total - approved;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const tCount = testimonials.length;
    const quizTotal = courses.length;
    const quizConfigured = quizConfiguredCount;
    const quizCoverage = quizTotal > 0 ? Math.round((quizConfigured / quizTotal) * 100) : 0;
    return { total, approved, pending, approvalRate, tCount, quizTotal, quizConfigured, quizCoverage };
  }, [users, testimonials.length, courses.length, quizConfiguredCount]);

  const registrationTrend = useMemo(() => {
    const days = 30;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    const buckets = new Map<string, { day: string; registrations: number; approvals: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = fmtDay(d);
      buckets.set(k, { day: k.slice(5), registrations: 0, approvals: 0 });
    }
    for (const u of users) {
      const created = u.createdAt ? new Date(u.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) continue;
      const k = fmtDay(created);
      const bucket = buckets.get(k);
      if (!bucket) continue;
      bucket.registrations += 1;
      if (u.approved) bucket.approvals += 1;
    }
    return Array.from(buckets.values());
  }, [users]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Analytics header */}
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Dashboard analytics
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Live statistics from learners, approvals, testimonials, and quizzes.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Approval rate</p>
              <p className="text-lg font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {stats.approvalRate}%
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-amber-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {stats.pending}
              </p>
            </div>
            <div className="hidden sm:block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Quiz coverage</p>
              <p className="text-lg font-bold text-primary flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4" /> {stats.quizCoverage}%
              </p>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Learners (total)</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Approved: <span className="font-semibold text-gray-900">{stats.approved}</span>
            </p>
          </div>
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Pending approvals</p>
            <p className="text-3xl font-extrabold text-amber-700 mt-1">{stats.pending}</p>
            <p className="text-sm text-gray-600 mt-1">Approve to unlock course access.</p>
          </div>
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Testimonials</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.tCount}</p>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-primary" /> Visible on home page.
            </p>
          </div>
          <div className="rounded-[24px] border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-500">Quizzes configured</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              {quizCountLoading || coursesLoading ? "…" : `${stats.quizConfigured}/${stats.quizTotal}`}
            </p>
            <p className="text-sm text-gray-600 mt-1">Per course assessments.</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Registrations (last 30 days)</h2>
          <p className="text-sm text-gray-600 mb-4">Daily registrations and approvals.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationTrend} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="registrations" stroke="#1B5E3F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approvals" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Learner status</h2>
          <p className="text-sm text-gray-600 mb-4">Approved vs pending (current).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Approved", value: stats.approved },
                  { name: "Pending", value: stats.pending },
                ]}
                margin={{ left: 0, right: 10, top: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1B5E3F" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course usage analytics (main dashboard only) */}
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Course usage
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Per-course quiz status, enrollments, and completion percentages.
        </p>
        {courseUsageLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4 font-semibold">Course</th>
                  <th className="py-2 pr-4 font-semibold">Sector</th>
                  <th className="py-2 pr-4 font-semibold">Duration</th>
                  <th className="py-2 pr-4 font-semibold">Quiz</th>
                  <th className="py-2 pr-4 font-semibold">Enrollments</th>
                  <th className="py-2 font-semibold flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" /> Completion
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseUsage.map((row) => (
                  <tr key={row.courseId} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{row.title}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.sector}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.duration}</td>
                    <td className="py-3 pr-4">
                      {row.hasQuiz ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-amber-600">No</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-900">{row.enrollmentCount}</td>
                    <td className="py-3 text-gray-900">{row.completionRatePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {courseUsage.length > 0 && (
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={courseUsage.map((c) => ({ name: c.title.replace(/^OSH in /, ""), completion: c.completionRatePercent, enrollments: c.enrollmentCount }))}
                margin={{ left: 0, right: 10, top: 5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completion" name="Completion %" fill="#1B5E3F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
