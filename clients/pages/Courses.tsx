import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HardHat,
  Building,
  Pickaxe,
  Shield,
  ArrowRight,
  Clock,
  LogOut,
  BookOpen,
  Utensils,
  Anchor,
  Flame,
  Leaf,
  HeartPulse,
  ShieldCheck,
  FileCheck,
  Globe,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";
import { getStoredUser, clearStoredUser } from "../lib/auth";
import { getApiBase } from "@/lib/apiBase";
import type { CourseDoc } from "@shared/api";

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

const INITIAL_COURSE_CARDS = 12;
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
          <SiteImage src="/ksohtc-3.webp" alt="" hero priority className="w-full h-full object-cover hero-zoom bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-[#121815]/80" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="eyebrow eyebrow--light justify-center mb-3 sm:mb-4">
            <span className="eyebrow__rule" />
            <span>Academic Curriculum</span>
          </div>
          <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-bone mb-4">Our Courses</h1>
          <p className="text-base sm:text-lg text-stone-200 max-w-2xl mx-auto leading-relaxed">
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
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-amber-50/80 border-b border-amber-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="inline-flex w-10 h-10 rounded-full bg-amber-100 items-center justify-center text-amber-800 border border-amber-200">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <p className="font-display font-semibold text-amber-900">Registration under review</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to access your courses and learning materials once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { clearStoredUser(); window.location.href = "/courses"; }}
              className="inline-flex items-center gap-2 text-amber-900 font-semibold hover:text-black transition-colors cursor-pointer text-sm shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 md:py-24 bg-[#FCFAF6] border-y border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <div className="eyebrow eyebrow--dark mb-2">
                <span className="eyebrow__rule" />
                <span>Available Catalog</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ink">Available courses</h2>
            </div>
            {!user && (
              <p className="text-sm text-stone-600">Click <strong className="text-stone-900">View materials</strong> on a card to go to the login page.</p>
            )}
          </div>

          {isLoading && (
            <p className="text-stone-500 py-8 font-mono text-sm">Loading courses…</p>
          )}
          {error && (
            <p className="text-red-600 py-8 text-sm">Could not load courses. Please try again later.</p>
          )}
          {!isLoading && !error && courses.length === 0 && (
            <p className="text-stone-500 py-8 text-sm">No courses available yet. Courses will appear here once they’re set up.</p>
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
                  className="editorial-card group flex flex-col h-full min-w-0 bg-white rounded-2xl overflow-hidden cursor-pointer"
                  title={fullDesc}
                >
                  <div className="w-full h-36 shrink-0 bg-stone-100 flex items-center justify-center overflow-hidden relative">
                    {coverUrl ? (
                      <SiteImage
                        src={coverUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        cloudinaryMaxWidth={640}
                        decoding="async"
                      />
                    ) : (
                      <span className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center text-primary">
                        <BookOpen className="w-6 h-6" />
                      </span>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0">
                    <span className="inline-flex w-9 h-9 rounded-xl bg-stone-100 border border-black/[0.06] items-center justify-center text-primary mb-3 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="font-display font-semibold text-base sm:text-lg text-ink mb-1 line-clamp-2 group-hover:text-primary transition-colors">{displayTitle}</h3>
                    <p className="text-xs font-mono uppercase tracking-wider text-brass font-semibold mb-2">{course.sector}</p>
                    <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 flex-1 min-h-0 leading-relaxed" title={fullDesc}>
                      {shortDesc}
                      {(course.description || "").length > 80 ? "…" : ""}
                    </p>
                    <p className="text-stone-400 font-mono text-xs my-3 shrink-0">
                      Duration: {course.duration}
                      {lessonCount != null && lessonCount > 0 && ` · ${lessonCount} lesson${lessonCount !== 1 ? "s" : ""}`}
                    </p>
                    <div className="mt-auto pt-3 border-t border-black/[0.06] shrink-0">
                      <Link
                        to="/login"
                        state={{ from: `/courses/${course.id}` }}
                        className="inline-flex items-center gap-1.5 text-primary font-mono text-xs uppercase tracking-wider font-semibold group-hover:text-brass transition-colors"
                      >
                        <span>View materials</span>
                        <ArrowRight className="w-3.5 h-3.5 btn-arrow-icon" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMoreCourses && (
            <div className="flex flex-wrap items-center gap-3 mt-10">
              {canShowMoreCourses && (
                <button
                  type="button"
                  onClick={() => setVisibleCourseCount((c) => c + COURSE_CARDS_STEP)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-black/[0.1] bg-white text-ink font-display text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 transition-colors cursor-pointer group"
                >
                  <span>View more</span>
                  <ArrowRight className="w-3.5 h-3.5 btn-arrow-icon" />
                </button>
              )}
              {canShowLessCourses && (
                <button
                  type="button"
                  onClick={() => setVisibleCourseCount(INITIAL_COURSE_CARDS)}
                  className="px-6 py-2.5 rounded-full border border-transparent text-stone-600 font-display text-xs font-semibold uppercase tracking-wider hover:text-ink transition-colors cursor-pointer"
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
