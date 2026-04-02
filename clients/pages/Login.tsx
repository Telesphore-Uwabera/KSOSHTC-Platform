import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LogIn, BookOpen, Loader2 } from "lucide-react";
import { setStoredUser } from "../lib/auth";
import { setAdminSessionToken } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  useEffect(() => {
    document.title = "Log In | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        const serverMessage = (data as { error?: string }).error;
        if (res.status === 404) {
          setError("Login service is unavailable. Please try again later or contact support.");
        } else if (res.status === 401) {
          setError(serverMessage ?? "Invalid email or password. Please check your credentials and try again.");
        } else {
          setError(serverMessage ?? "Login failed. Please try again.");
        }
        return;
      }
      const user = (data as { user?: unknown }).user;
      const adminSessionToken = (data as { adminSessionToken?: string }).adminSessionToken;
      if (user && typeof user === "object" && "id" in user) {
        const role = (user as { role?: string }).role;
        if (role === "admin") setAdminSessionToken(adminSessionToken ?? null);
        else setAdminSessionToken(null);
        setStoredUser(user as Parameters<typeof setStoredUser>[0]);
        // If they tried to open a course (e.g. Safety or any) from the courses page, send them to dashboard so they access materials through the dashboard
        const redirectTo = from.startsWith("/courses/") ? "/dashboard" : from;
        navigate(redirectTo, { replace: true });
      }
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
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
          <div className="bg-white rounded-[30px] shadow-xl border border-gray-200 overflow-hidden scroll-reveal reveal-scale">
            <div className="w-full bg-primary text-white px-6 sm:px-8 py-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
                <LogIn className="w-6 h-6" />
                Log in
              </h1>
              <p className="mt-2 text-primary-foreground/90 text-sm sm:text-base">
                Sign in to access your courses after admin approval.
              </p>
            </div>

            <div className="p-6 sm:p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-primary" />
                    Remember me
                  </label>
                  <Link to="/forgot-password" id="forgot-password-link" className="text-sm font-semibold text-primary hover:underline">
                    Forgot password?
                  </Link>
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

              <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                <p className="text-center text-gray-600 text-sm">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-semibold text-primary hover:text-primary/80 underline">
                    Create account
                  </Link>
                </p>
                <p className="text-center">
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    <BookOpen className="w-4 h-4" />
                    View courses
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