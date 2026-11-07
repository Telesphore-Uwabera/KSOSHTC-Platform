import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Set New Password | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiBase() + "/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to reset password. The link may be invalid or expired.");
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3.5 rounded-2xl border border-black/[0.12] bg-bone text-ink placeholder-ink/40 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm";

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-ink overflow-x-hidden font-sans antialiased flex flex-col">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="flex-1 w-full py-12 sm:py-20 flex items-center justify-center">
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[32px] shadow-2xl border border-black/[0.08] overflow-hidden">
            {/* Obsidian Header */}
            <div className="w-full bg-[#121815] text-bone px-8 sm:px-12 py-10 border-b border-white/10">
              <div className="eyebrow eyebrow--light mb-3">
                <span className="text-brass">KSOSHTC</span>
                <span className="eyebrow__rule" />
                <span>CREDENTIAL UPDATE</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-bone tracking-tight">
                New <span className="font-serif italic text-accent font-normal">Password</span>
              </h1>
              <p className="mt-2 text-bone/70 text-sm font-light">
                Secure your account by choosing a new, resilient password.
              </p>
            </div>

            <div className="p-8 sm:p-12">
              {success ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="font-display text-2xl font-normal text-ink mb-2">Password Reset Successful!</h2>
                  <p className="text-ink/70 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">
                    Your password has been successfully updated. Redirecting you to login...
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary font-semibold hover:underline"
                  >
                    Go to login manually
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-red-700 text-xs sm:text-sm bg-red-50/80 border border-red-200/80 p-4 rounded-2xl">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className={inputStyle + " pr-12"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={inputStyle}
                      />
                    </div>
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
                        <ShieldCheck className="w-4 h-4" />
                        <span>UPDATE PASSWORD</span>
                        <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center ml-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </>
                    )}
                  </button>

                  <div className="pt-4 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/60 hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to login
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
