import { Link, Outlet, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, BookOpen, Users, MessageSquareQuote, BarChart3, FolderOpen, Settings, ClipboardList, LogOut, FileSpreadsheet, ShieldCheck, UserCog } from "lucide-react";
import Header from "../../components/Header";
import { cn } from "@/lib/utils";
import { clearStoredUser, getStoredUser } from "@/lib/auth";
import { clearAdminSessionPolicy, getAdminSessionToken, serverExpectsAdminBearer, setAdminSessionToken } from "@/lib/adminApi";

function navForRole(role: string | undefined) {
  const staffCore = [
    { to: "/admin/courses", end: false, label: "Courses & Quizzes", icon: BookOpen },
    { to: "/admin/course-content", end: true, label: "Course content", icon: FolderOpen },
    { to: "/admin/assignment-submissions", end: true, label: "Assignments", icon: ClipboardList },
    { to: "/admin/distribute-pdf", end: true, label: "Distribute files", icon: FileSpreadsheet },
  ];
  if (role === "admin") {
    return [
      { to: "/admin", end: true, label: "Dashboard", icon: BarChart3 },
      ...staffCore,
      { to: "/admin/learners", end: true, label: "Learners", icon: Users },
      { to: "/admin/instructors", end: true, label: "Instructors", icon: UserCog },
      { to: "/admin/certificate", end: true, label: "Certificates", icon: ShieldCheck },
      { to: "/admin/testimonials", end: true, label: "Testimonials", icon: MessageSquareQuote },
      { to: "/admin/settings", end: true, label: "Settings", icon: Settings },
    ];
  }
  return staffCore;
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = user && typeof user === "object" ? (user as { role?: string }).role : undefined;
  const isAdmin = role === "admin";

  if (role === "instructor") return <Navigate to="/instructor/course-content" replace />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  if (isAdmin && !getAdminSessionToken() && serverExpectsAdminBearer()) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const nav = navForRole(role);

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
                <p className="font-bold text-gray-900">{role === "admin" ? "Admin" : "Instructor"}</p>
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
              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
                <p>
                  Signed in as <span className="font-semibold text-gray-700 block truncate" title={user?.email ?? ""}>{user?.email ?? ""}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAdminSessionToken(null);
                    clearAdminSessionPolicy();
                    clearStoredUser();
                    navigate("/admin/login", { replace: true });
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  Log out
                </button>
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
