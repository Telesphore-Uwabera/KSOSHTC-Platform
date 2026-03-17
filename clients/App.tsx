import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { LoadingBar, PageLoaderFallback } from "@/components/PageLoader";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";
import BackToTop from "@/components/BackToTop";
import { getApiBase } from "@/lib/apiBase";
import { BrandedSplashScreen } from "@/components/BrandedSplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Programs = lazy(() => import("./pages/Programs"));
const Industries = lazy(() => import("./pages/Industries"));
const Contact = lazy(() => import("./pages/Contact"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminCourseQuiz = lazy(() => import("./pages/admin/AdminCourseQuiz"));
const AdminCourseContent = lazy(() => import("./pages/admin/AdminCourseContent"));
const AdminCourseContentDetail = lazy(() => import("./pages/admin/AdminCourseContentDetail"));
const AdminModuleAssessment = lazy(() => import("./pages/admin/AdminModuleAssessment"));
const AdminLearners = lazy(() => import("./pages/admin/AdminLearners"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const TakeQuiz = lazy(() => import("./pages/TakeQuiz"));
const TakeModuleQuiz = lazy(() => import("./pages/TakeModuleQuiz"));
const StudentLayout = lazy(() => import("./pages/StudentLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardCourses = lazy(() => import("./pages/DashboardCourses"));
const DashboardProgress = lazy(() => import("./pages/DashboardProgress"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min: show cached data instantly when revisiting a page
      refetchOnWindowFocus: false,
    },
  },
});

/** Smooth scroll to a y position or element over ~1s with ease-in-out (flowing feel). */
function smoothScrollTo(target: number | HTMLElement) {
  const start = window.scrollY;
  const end = typeof target === "number" ? target : target.getBoundingClientRect().top + start;
  const distance = end - start;
  const duration = 1000;
  let startTime: number | null = null;

  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(now: number) {
    if (startTime == null) startTime = now;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, start + distance * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (el) {
        const t = setTimeout(() => smoothScrollTo(el), 50);
        return () => clearTimeout(t);
      }
    }
    smoothScrollTo(0);
  }, [pathname, hash]);
  return null;
}

function PrefetchKeyData() {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["course-content", "courses"],
      queryFn: async () => {
        const res = await fetch(getApiBase() + "/api/course-content/courses");
        if (!res.ok) return [];
        const data = await res.json();
        return (data.courses ?? []).filter((c: { published?: boolean }) => c.published !== false);
      },
    });
    queryClient.prefetchQuery({
      queryKey: ["testimonials"],
      queryFn: async () => {
        const res = await fetch(getApiBase() + "/api/testimonials");
        if (!res.ok) return [];
        return res.json();
      },
    });
  }, [queryClient]);
  return null;
}

function RouteLoader() {
  const location = useLocation();
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    setShowBar(true);
    const t = setTimeout(() => setShowBar(false), 450);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return showBar ? <LoadingBar /> : null;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Fail-safe: Ensure the app is NEVER stuck on the splash screen.
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 10000); // 10 seconds max
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          {showSplash && <BrandedSplashScreen onComplete={() => setShowSplash(false)} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PrefetchKeyData />
            <RouteLoader />
            <ScrollRevealObserver />
            <Suspense fallback={<PageLoaderFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/industries" element={<Industries />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:courseId" element={<CourseDetail />} />
                <Route path="/courses/:courseId/modules/:moduleId/quiz/:assessmentId" element={<TakeModuleQuiz />} />
                <Route path="/dashboard" element={<StudentLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="courses" element={<DashboardCourses />} />
                  <Route path="progress" element={<DashboardProgress />} />
                  <Route path="settings" element={<DashboardSettings />} />
                </Route>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="courses/:courseId/quiz" element={<AdminCourseQuiz />} />
                  <Route path="course-content" element={<AdminCourseContent />} />
                  <Route path="course-content/:courseId" element={<AdminCourseContentDetail />} />
                  <Route path="course-content/:courseId/modules/:moduleId/assessments/:assessmentId" element={<AdminModuleAssessment />} />
                  <Route path="learners" element={<AdminLearners />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/courses/:courseId/quiz/take" element={<TakeQuiz />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BackToTop />
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
