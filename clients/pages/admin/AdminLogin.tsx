import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";
import { getStoredUser, setStoredUser } from "@/lib/auth";
import { setAdminSessionToken } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const existing = getStoredUser();
  if (existing) {
    const role = (existing as { role?: string }).role;
    if (role === "admin") return <Navigate to="/admin" replace />;
    // Student/learner cannot use admin login — send to learner dashboard
    return <Navigate to="/dashboard" replace state={{ message: "Use the learner login for your dashboard." }} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(getApiBase() + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Login failed.");
        return;
      }
      const user = (data as { user?: unknown }).user;
      const adminSessionToken = (data as { adminSessionToken?: string }).adminSessionToken;
      if (user && typeof user === "object" && "id" in user) {
        const role = (user as { role?: string }).role;
        if (role !== "admin") {
          setError("Only administrators can sign in here. Use the main login page for learners.");
          return;
        }
        setAdminSessionToken(adminSessionToken ?? null);
        setStoredUser(user as Parameters<typeof setStoredUser>[0]);
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from && from.startsWith("/admin") ? from : "/admin", { replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="w-full min-h-[calc(100vh-6rem)] py-12 sm:py-16 md:py-24 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[30px] shadow-xl border border-gray-200 overflow-hidden">
            <div className="w-full bg-secondary text-white px-6 sm:px-8 py-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                Admin login
              </h1>
              <p className="mt-2 text-white/90 text-sm sm:text-base">
                Manage learners, courses, quizzes, and platform analytics.
              </p>
            </div>

            <div className="p-6 sm:p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent/80 text-black font-bold py-3.5 px-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Log in
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 space-y-2">
                <p className="text-center text-gray-600 text-sm">
                  Not an admin?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:text-primary/80 underline">
                    Learner login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

