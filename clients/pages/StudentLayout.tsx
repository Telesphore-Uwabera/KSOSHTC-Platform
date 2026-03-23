import { Link, Outlet, NavLink, Navigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, BookOpen, BarChart3, Settings, FileUp } from "lucide-react";
import Header from "../components/Header";
import { cn } from "@/lib/utils";
import { getStoredUser } from "../lib/auth";

const nav = [
  { to: "/dashboard", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/courses", end: true, label: "My courses", icon: BookOpen },
  { to: "/dashboard/progress", end: true, label: "Progress", icon: BarChart3 },
  { to: "/dashboard/work-submissions", end: true, label: "Submit work", icon: FileUp },
  { to: "/dashboard/settings", end: true, label: "Settings", icon: Settings },
];

export default function StudentLayout() {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace state={{ from: "/dashboard" }} />;
  if ((user as { role?: string }).role === "admin") return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Header />
      <div className="h-20 sm:h-24 md:h-28 shrink-0" aria-hidden="true" />

      <div className="bg-gray-50 flex-1 min-h-0 flex flex-col">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 flex-1 w-full flex flex-col min-h-0">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-secondary font-medium mb-6 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6 flex-1 min-h-0 items-stretch">
            <aside className="bg-white rounded-[30px] border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col min-h-[320px] lg:min-h-[calc(100vh-12rem)]">
              <div className="flex items-center gap-2 mb-5 shrink-0">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <p className="font-bold text-gray-900">Learner</p>
              </div>
              <nav className="space-y-1.5 flex-1">
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
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-sm">{label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 shrink-0">
                Signed in as <span className="font-semibold text-gray-700 block truncate" title={user?.email ?? ""}>{user?.email ?? ""}</span>
              </div>
            </aside>

            <main className="min-w-0 flex flex-col overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
