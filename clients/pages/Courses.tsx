import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HardHat, Building, Pickaxe, Shield, ArrowRight, Clock, LogOut, BookOpen } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getStoredUser, clearStoredUser } from "../lib/auth";
import { getApiBase } from "@/lib/apiBase";
import type { CourseDoc } from "@shared/api";

const iconBySlug: Record<string, typeof HardHat> = {
  construction: HardHat,
  "industrial-safety": Building,
  mining: Pickaxe,
  "safety-management": Shield,
  "safety-for-all": Shield,
};

async function fetchCoursesFromFirestore(): Promise<CourseDoc[]> {
  const res = await fetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data.courses ?? []).filter((c: CourseDoc) => c.published !== false);
}

/** Fetch courses from Firestore. Returns sorted by order. */
async function fetchCourses(): Promise<CourseDoc[]> {
  const courses = await fetchCoursesFromFirestore();
  return courses.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

/** For an approved learner with sector: only show their sector course + safety-management. */
function filterCoursesBySector(courses: CourseDoc[], sector: string | undefined): CourseDoc[] {
  if (!sector) return courses;
  return courses.filter((c) => c.id === "safety-management" || c.id === sector);
}

const INITIAL_COURSE_CARDS = 6;
const COURSE_CARDS_STEP = 6;

/** Display title as "1. Name of course", "2. Name of course". */
function numberedTitle(index: number, title: string): string {
  return `${index + 1}. ${title}`;
}

export default function Courses() {
  const location = useLocation();
  const locationState = location.state as { message?: string; accessDenied?: boolean } | null;
  const stateMessage = locationState?.message;
  const accessDenied = locationState?.accessDenied === true;
  const user = getStoredUser();
  const pending = user && !user.approved;
  const canAccess = user && user.approved;

  useEffect(() => {
    document.title = "Courses | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  const { data: allCourses = [], isLoading, error } = useQuery({
    queryKey: ["course-content", "courses"],
    queryFn: fetchCourses,
    enabled: true,
  });

  // Courses page shows all 4 categories to everyone; sector filtering is only on the dashboard.
  const courses = allCourses;
  const [visibleCourseCount, setVisibleCourseCount] = useState(INITIAL_COURSE_CARDS);
  const visibleCourses = courses.slice(0, visibleCourseCount);
  const hasMoreCourses = courses.length > INITIAL_COURSE_CARDS;
  const canShowMoreCourses = visibleCourseCount < courses.length;
  const canShowLessCourses = visibleCourseCount > INITIAL_COURSE_CARDS;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="relative text-white py-16 sm:py-20 md:py-28 min-h-[40vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/ksohtc-3.webp" alt="" className="w-full h-full object-cover hero-zoom bg-image-animate bg-image-move-endless" loading="lazy" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-secondary/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 hero-reveal-slow" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>Our Courses</h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto hero-reveal-slow" style={{ animationDelay: "0.9s", animationFillMode: "both" }}>
            {!user
              ? "Browse all course categories below. Click Enroll on a course to log in and enroll."
              : canAccess
                ? "Choose a course below to view materials and start studying."
                : "Thank you for registering. Your account is under review by our admin team. You’ll get access to courses once approved—log out and log in again after approval to refresh."}
          </p>
        </div>
      </section>

      {stateMessage && (
        <section
          className={
            accessDenied
              ? "py-4 px-4 sm:px-6 lg:px-8 bg-red-50 border-b border-red-200"
              : "py-4 px-4 sm:px-6 lg:px-8 bg-primary/10 border-b border-primary/20"
          }
        >
          <div className="max-w-7xl mx-auto text-center">
            <p className={accessDenied ? "text-red-800 font-medium" : "text-primary font-medium"}>
              {accessDenied ? "Access denied. " : ""}{stateMessage}
            </p>
          </div>
        </section>
      )}
      {pending && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-10 h-10 rounded-full bg-amber-200 items-center justify-center text-amber-800">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-amber-900">Registration under review</p>
                <p className="text-sm text-amber-800">
                  Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to access your courses and learning materials once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { clearStoredUser(); window.location.href = "/courses"; }}
              className="inline-flex items-center gap-2 text-amber-800 font-semibold hover:text-amber-900"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-sway">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 scroll-reveal reveal-right-slow delay-400">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">Available courses</h2>
            {!user && (
              <p className="text-sm text-gray-600">Click <strong>View materials</strong> on a card to go to the login page.</p>
            )}
          </div>

          {isLoading && (
            <p className="text-gray-600 py-8">Loading courses…</p>
          )}
          {error && (
            <p className="text-red-600 py-8">Could not load courses. Please try again later.</p>
          )}
          {!isLoading && !error && courses.length === 0 && (
            <p className="text-gray-600 py-8">No courses available yet. Courses will appear here once they’re set up.</p>
          )}

          <div className="grid w-full min-w-0 grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {visibleCourses.map((course, idx) => {
              const Icon = iconBySlug[course.slug ?? course.id] ?? HardHat;
              const lessonCount = (course as { lessonCount?: number }).lessonCount;
              const shortDesc = (course.description || "Occupational Safety and Health training.").slice(0, 80);
              const fullDesc = course.description || "Occupational Safety and Health training.";
              const coverUrl = course.coverImageUrl;
              const displayTitle = numberedTitle(idx, course.title);
              return (
                <div
                  key={course.id}
                  className="flex flex-col h-full min-w-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all duration-200 course-card"
                  style={{ animationDelay: `${0.9 + idx * 0.15}s` }}
                  title={fullDesc}
                >
                  <div className="w-full h-32 shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {coverUrl ? (
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center text-primary">
                        <BookOpen className="w-6 h-6" />
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0">
                    <span className="inline-flex w-9 h-9 rounded-lg bg-primary/10 items-center justify-center text-primary mb-2 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-primary mb-1 line-clamp-2">{displayTitle}</h3>
                    <p className="text-xs text-accent font-medium mb-1">{course.sector}</p>
                    <p className="text-gray-600 text-xs line-clamp-2 flex-1 min-h-0" title={fullDesc}>
                      {shortDesc}
                      {(course.description || "").length > 80 ? "…" : ""}
                    </p>
                    <p className="text-gray-500 text-xs mb-3 shrink-0">
                      Duration: {course.duration}
                      {lessonCount != null && lessonCount > 0 && ` · ${lessonCount} lesson${lessonCount !== 1 ? "s" : ""}`}
                    </p>
                    <div className="mt-auto pt-2 border-t border-gray-100 shrink-0">
                      <Link
                        to="/login"
                        state={{ from: `/courses/${course.id}` }}
                        className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:text-accent transition-colors"
                      >
                        View materials
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMoreCourses && (
            <div className="flex flex-wrap items-center gap-3 mt-8">
              {canShowMoreCourses && (
                <button
                  type="button"
                  onClick={() => setVisibleCourseCount((c) => c + COURSE_CARDS_STEP)}
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:text-accent transition-colors"
                >
                  View more
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {canShowLessCourses && (
                <button
                  type="button"
                  onClick={() => setVisibleCourseCount(INITIAL_COURSE_CARDS)}
                  className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                  View less
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
