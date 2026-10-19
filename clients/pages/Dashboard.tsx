import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  FileText,
  ExternalLink,
  Loader2,
  Utensils,
  Anchor,
  Flame,
  Leaf,
  HeartPulse,
  ShieldCheck,
  FileCheck,
  Globe,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { useDashboardData, SECTOR_LABELS } from "./dashboardData";
import { getStoredUser } from "../lib/auth";
import { buildAdminHandoutStreamUrl, fetchLearnerHandouts } from "@/lib/learnerAdminHandouts";
import { getApiBase } from "@/lib/apiBase";

const iconBySlug: Record<string, typeof HardHat> = {
  construction: HardHat,
  "industrial-safety": Building,
  mining: Pickaxe,
  "food-safety": Utensils,
  "safety-management": ShieldCheck,
  "safe-lifting-operations": Anchor,
  "fire-safety-and-egress": Flame,
  esg: Leaf,
  "first-aid": HeartPulse,
  "iso-45001": FileCheck,
  "iso-14011": Globe,
  "safety-for-all": Shield,
};

export default function Dashboard() {
  const stored = getStoredUser();
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

  const { data: freshUser } = useQuery({
    queryKey: ["user-me", stored?.id],
    queryFn: async () => {
      if (!stored?.id) return null;
      const res = await fetch(`${getApiBase()}/api/users/${stored.id}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.user;
    },
    enabled: !!stored?.id && canAccess,
  });

  const currentUser = freshUser || user;

  const { data: handouts = [], isLoading: handoutsLoading } = useQuery({
    queryKey: ["admin-distributed-assignments", "learner", stored?.id],
    queryFn: () => fetchLearnerHandouts(stored?.id || ""),
    enabled: !!stored?.id && canAccess,
  });

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

  const categoryLabel = currentUser?.sector ? (SECTOR_LABELS[currentUser.sector] ?? currentUser.sector) : "All categories";
  const handoutPreview = handouts.slice(0, 3);

  const totalFees = currentUser?.totalFees !== undefined ? currentUser.totalFees : 150000;
  const paymentAmount = currentUser?.paymentAmount !== undefined ? currentUser.paymentAmount : (currentUser?.approved ? 150000 : 0);
  const balanceFee = currentUser?.balanceFee !== undefined ? currentUser.balanceFee : Math.max(0, totalFees - paymentAmount);
  const isFeesCleared = balanceFee <= 0;

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
          {currentUser?.sector
            ? "You see only courses for your sector (and General). Open a course in My courses to view materials and mark lessons as done."
            : "Open a course in My courses to view materials and track progress."}
        </p>

        {/* Student Financial Dashboard */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/70 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Tuition & Financial Status</h2>
                <p className="text-xs text-gray-500">
                  Official Student ID: <span className="font-mono font-bold text-primary">{currentUser?.idCardNo || "—"}</span>
                </p>
              </div>
            </div>
            {(currentUser?.invoiceNo || currentUser?.idCardNo) && (
              <Link
                to={`/receipt/${currentUser.invoiceNo || currentUser.idCardNo}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                View Official Invoice / Receipt
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Fees */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Fees Required</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-gray-900 mt-1">
                {Number(totalFees).toLocaleString()}{" "}
                <span className="text-xs font-medium text-gray-500 font-sans">RWF</span>
              </p>
              <span className="text-[11px] text-gray-500 mt-2">Course tuition & exam fees</span>
            </div>

            {/* Amount Paid */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Amount Paid</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
                {Number(paymentAmount).toLocaleString()}{" "}
                <span className="text-xs font-medium text-emerald-600 font-sans">RWF</span>
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Verified by finance</span>
              </div>
            </div>

            {/* Remaining Balance */}
            <div
              className={`p-4 rounded-xl shadow-2xs flex flex-col justify-between border ${
                isFeesCleared ? "bg-green-50/40 border-green-200" : "bg-amber-50/50 border-amber-200"
              }`}
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${isFeesCleared ? "text-green-800" : "text-amber-800"}`}>
                Remaining Balance Owed
              </span>
              <p className={`text-xl sm:text-2xl font-black font-mono mt-1 ${isFeesCleared ? "text-green-700" : "text-amber-700"}`}>
                {Number(balanceFee).toLocaleString()}{" "}
                <span className="text-xs font-medium font-sans">RWF</span>
              </p>
              <span className="text-[11px] mt-2 font-medium text-gray-600">
                {isFeesCleared
                  ? "✓ All tuition fees fully cleared"
                  : "MoMo: 0785072512 (EMMANUEL NIYOBUHUNGIRO)"}
              </span>
            </div>
          </div>
        </div>

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

        {(handoutsLoading || handouts.length > 0) && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm font-bold text-gray-900">Assignments from KSOSHTC</p>
              </div>
              <Link
                to="/dashboard/handouts"
                className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                View all
              </Link>
            </div>
            {handoutsLoading ? (
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </p>
            ) : (
              <>
                <ul className="space-y-2 mb-3">
                  {handoutPreview.map((h) => (
                    <li
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm bg-white/80 rounded-xl px-3 py-2 border border-gray-100"
                    >
                      <span className="font-medium text-gray-800 truncate min-w-0">{h.title}</span>
                      <a
                        href={buildAdminHandoutStreamUrl(h.pdfUrl, h.originalFilename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary font-semibold shrink-0"
                      >
                        PDF <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
                {handouts.length > 3 && (
                  <p className="text-xs text-gray-600">
                    +{handouts.length - 3} more —{" "}
                    <Link to="/dashboard/handouts" className="font-semibold text-primary hover:underline">
                      open Assignments
                    </Link>
                  </p>
                )}
              </>
            )}
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
            to="/dashboard/handouts"
            className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold py-2.5 px-5 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Assignments
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