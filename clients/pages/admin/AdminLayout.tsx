import { Link, Outlet, NavLink, Navigate, useLocation } from "react-router-dom";
import { useRef } from "react";
import { ArrowLeft, LayoutDashboard, BookOpen, Users, MessageSquareQuote, BarChart3, FolderOpen, Settings, ClipboardList } from "lucide-react";
import Header from "../../components/Header";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";

const nav = [
  { to: "/admin", end: true, label: "Dashboard", icon: BarChart3 },
  { to: "/admin/courses", end: false, label: "Courses & Quizzes", icon: BookOpen },
  { to: "/admin/course-content", end: true, label: "Course content", icon: FolderOpen },
  { to: "/admin/learners", end: true, label: "Learners", icon: Users },
  { to: "/admin/assignment-submissions", end: true, label: "Assignments", icon: ClipboardList },
  { to: "/admin/testimonials", end: true, label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/settings", end: true, label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const adminVerifiedRef = useRef(false);
  const user = getStoredUser();
  const isAdmin = user && (user as { role?: string }).role === "admin";

  if (!user || !isAdmin) adminVerifiedRef.current = false;
  if (!adminVerifiedRef.current) {
    if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    adminVerifiedRef.current = true;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-20 sm:h-24 md:h-28" aria-hidden="true" />

      <div className="bg-gray-50 min-h-[calc(100vh-7rem)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-secondary font-medium mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 sm:gap-6 items-start">
            <aside className="bg-white rounded-[30px] border border-gray-200 shadow-sm p-4 sm:p-5 lg:sticky lg:top-28">
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <p className="font-bold text-gray-900">Admin</p>
              </div>
              <nav className="space-y-2">
                {nav.map(({ to, end, label, icon: Icon }) => (
                  <NavLink
                    key={to + label}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-2xl font-semibold transition-colors",
                        isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )
                    }
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span className="text-sm">{label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
                Signed in as <span className="font-semibold text-gray-700">{user?.email ?? ""}</span>
              </div>
            </aside>

            <main className="min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
