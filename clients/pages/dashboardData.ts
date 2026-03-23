import { useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredUser } from "../lib/auth";
import { getApiBase } from "@/lib/apiBase";
import type { CourseDoc, EnrollmentDoc, ProgressDoc, SubmissionDoc } from "@shared/api";

export interface CourseStats {
  totalLessons: number;
  totalAssessments: number;
}

export async function fetchCourses(): Promise<CourseDoc[]> {
  const res = await fetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) throw new Error("Failed to load courses");
  const data = await res.json();
  return (data.courses ?? []).filter((c: CourseDoc) => c.published !== false);
}

export async function fetchAllProgress(userId: string): Promise<ProgressDoc[]> {
  const res = await fetch(getApiBase() + "/api/progress?userId=" + encodeURIComponent(userId));
  if (!res.ok) return [];
  const data = await res.json();
  const p = data.progress;
  return Array.isArray(p) ? p : [];
}

export async function fetchUserEnrollments(userId: string): Promise<EnrollmentDoc[]> {
  const res = await fetch(getApiBase() + "/api/enrollments?userId=" + encodeURIComponent(userId));
  if (!res.ok) return [];
  const data = await res.json();
  return data.enrollments ?? [];
}

export async function fetchCourseStats(courseId: string): Promise<CourseStats> {
  const res = await fetch(getApiBase() + "/api/course-content/courses/" + encodeURIComponent(courseId) + "/stats");
  if (!res.ok) return { totalLessons: 0, totalAssessments: 0 };
  return res.json();
}

export async function fetchUserSubmissions(userId: string): Promise<SubmissionDoc[]> {
  const res = await fetch(getApiBase() + "/api/submissions?userId=" + encodeURIComponent(userId));
  if (!res.ok) return [];
  const data = await res.json();
  return data.submissions ?? [];
}

export function filterCoursesBySector(courses: CourseDoc[], sector: string | undefined): CourseDoc[] {
  if (!sector) return courses;
  return courses.filter((c) => c.id === "safety-management" || c.id === sector);
}

export const SECTOR_LABELS: Record<string, string> = {
  construction: "Construction",
  "industrial-safety": "Industrial Safety",
  mining: "Mining",
  "safety-management": "General",
  "safety-for-all": "Safety for All",
};

export function useDashboardData() {
  const user = getStoredUser();
  const canAccess = user?.approved ?? false;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!canAccess || !user?.id) return;
    const onFocus = () => queryClient.invalidateQueries({ queryKey: ["progress", user.id] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [canAccess, user?.id, queryClient]);

  const { data: allCourses = [], isLoading, error } = useQuery({
    queryKey: ["course-content", "courses"],
    queryFn: fetchCourses,
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => fetchAllProgress(user!.id),
    enabled: !!user?.id && canAccess,
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ["submissions", user?.id],
    queryFn: () => fetchUserSubmissions(user!.id),
    enabled: !!user?.id && canAccess,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => fetchUserEnrollments(user!.id),
    enabled: !!user?.id && canAccess,
  });

  const courses = useMemo(() => {
    const enrolledCourseIds = new Set((enrollments as EnrollmentDoc[]).map((e) => e.courseId));
    // Prefer explicit enrollments when they exist (admin-assigned or learner-enrolled courses).
    if (enrolledCourseIds.size > 0) {
      return allCourses.filter((c) => enrolledCourseIds.has(c.id));
    }
    // Fallback for older accounts with no enrollment docs yet.
    return filterCoursesBySector(allCourses, user?.sector);
  }, [allCourses, enrollments, user?.sector]);
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);

  const { data: statsByCourse = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["course-stats", courseIds.join("|")],
    queryFn: async () => {
      const entries = await Promise.all(
        courseIds.map(async (id) => {
          const s = await fetchCourseStats(id);
          return [id, s] as const;
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: courseIds.length > 0 && canAccess,
  });

  const progressByCourse = useMemo(
    () => Object.fromEntries((allProgress as ProgressDoc[]).map((p) => [p.courseId, p])),
    [allProgress]
  );

  const { kpis, rows } = useMemo(() => {
    let totalCompletedLessons = 0;
    let totalPassedQuizzes = 0;
    let totalLessons = 0;
    let totalAssessments = 0;
    const rows: Array<{
      course: CourseDoc;
      completedLessons: number;
      totalLessons: number;
      passedQuizzes: number;
      totalAssessments: number;
      completionPercent: number;
      latestPerformance?: {
        score: number;
        maxScore: number;
        percentage: number;
        passed: boolean;
      };
    }> = [];

    for (const course of courses) {
      const progress = progressByCourse[course.id];
      const stats = statsByCourse[course.id] ?? { totalLessons: 0, totalAssessments: 0 };
      const completedLessons = progress?.completedLessonIds?.length ?? 0;
      const passedQuizzes = progress?.completedAssessmentIds?.length ?? 0;
      const totalSteps = stats.totalLessons + stats.totalAssessments;
      const completedSteps = completedLessons + passedQuizzes;
      const completionPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      // Find latest performance for this course
      const courseSubmissions = allSubmissions.filter(s => s.courseId === course.id);
      const latestSub = courseSubmissions.length > 0 ? courseSubmissions[0] : undefined;

      totalCompletedLessons += completedLessons;
      totalPassedQuizzes += passedQuizzes;
      totalLessons += stats.totalLessons;
      totalAssessments += stats.totalAssessments;
      rows.push({
        course,
        completedLessons,
        totalLessons: stats.totalLessons,
        passedQuizzes,
        totalAssessments: stats.totalAssessments,
        completionPercent,
        latestPerformance: latestSub ? {
          score: latestSub.score,
          maxScore: latestSub.maxScore,
          percentage: latestSub.percentage,
          passed: latestSub.passed
        } : undefined
      });
    }

    const totalSteps = totalLessons + totalAssessments;
    const totalCompleted = totalCompletedLessons + totalPassedQuizzes;
    const overallPercent = totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0;

    return {
      kpis: {
        completedSections: totalCompletedLessons + totalPassedQuizzes,
        completedLessons: totalCompletedLessons,
        passedQuizzes: totalPassedQuizzes,
        overallPercent,
        totalSteps,
      },
      rows,
    };
  }, [courses, progressByCourse, statsByCourse, allSubmissions]);

  return {
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
  };
}
