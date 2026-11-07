import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LogIn, BookOpen, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { setStoredUser } from "../lib/auth";
import { setAdminSessionPolicyFromLogin, setAdminSessionToken } from "@/lib/adminApi";
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
  const [showPassword, setShowPassword] = useState(false);

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
      const adminSessionWarning = (data as { adminSessionWarning?: string }).adminSessionWarning;
      if (user && typeof user === "object" && "id" in user) {
        const role = (user as { role?: string }).role;
        if (role === "admin" || role === "instructor") setAdminSessionToken(adminSessionToken ?? null);
        else setAdminSessionToken(null);
        setAdminSessionPolicyFromLogin({ adminSessionToken, adminSessionWarning }, role);
        setStoredUser(user as Parameters<typeof setStoredUser>[0]);
        if (role === "admin") {
          navigate(from.startsWith("/admin") ? from : "/admin", { replace: true });
        } else if (role === "instructor") {
          navigate(from.startsWith("/instructor") ? from : "/instructor", { replace: true });
        } else {
          const redirectTo = from.startsWith("/courses/") ? "/dashboard" : from;
          navigate(redirectTo, { replace: true });
        }
      }
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-ink overflow-x-hidden font-sans antialiased flex flex-col">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="flex-1 w-full py-12 sm:py-20 flex items-center justify-center">
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[32px] shadow-2xl border border-black/[0.08] overflow-hidden">
            {/* Editorial Obsidian Header */}
            <div className="w-full bg-[#121815] text-bone px-8 sm:px-12 py-10 border-b border-white/10">
              <div className="eyebrow eyebrow--light mb-3">
                <span className="text-brass">KSOSHTC</span>
                <span className="eyebrow__rule" />
                <span>STUDENT &amp; STAFF PORTAL</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-bone tracking-tight">
                Welcome <span className="font-serif italic text-accent font-normal">Back</span>
              </h1>
              <p className="mt-2 text-bone/70 text-sm font-light">
                Sign in to access your course materials, progress assessments, and certifications.
              </p>
            </div>

            <div className="p-8 sm:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="text-red-700 text-xs sm:text-sm bg-red-50/80 border border-red-200/80 p-4 rounded-2xl">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-black/[0.12] bg-bone text-ink placeholder-ink/40 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border border-black/[0.12] bg-bone text-ink placeholder-ink/40 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all pr-12 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-ink/70 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border border-black/20 text-primary focus:ring-primary" />
                    Remember me
                  </label>
                  <Link to="/forgot-password" id="forgot-password-link" className="font-mono text-xs uppercase tracking-wider text-brass hover:text-primary transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-accent text-[#121815] font-semibold py-4 px-6 rounded-full shadow-lg hover:shadow-xl hover:bg-accent-light transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink/70">
                <p>
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-semibold text-primary hover:underline">
                    Create account
                  </Link>
                </p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider text-brass hover:text-primary transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  View courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
