import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

export default function ForgotPassword() {
  useEffect(() => {
    document.title = "Forgot Password | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(getApiBase() + "/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send reset link. Please try again.");
        return;
      }
      setSuccessMessage(data.message ?? "");
      setSuccess(true);
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
            {/* Obsidian Header */}
            <div className="w-full bg-[#121815] text-bone px-8 sm:px-12 py-10 border-b border-white/10">
              <div className="eyebrow eyebrow--light mb-3">
                <span className="text-brass">KSOSHTC</span>
                <span className="eyebrow__rule" />
                <span>CREDENTIAL RECOVERY</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-bone tracking-tight">
                Reset <span className="font-serif italic text-accent font-normal">Password</span>
              </h1>
              <p className="mt-2 text-bone/70 text-sm font-light">
                Enter your registered email address to receive an official recovery link.
              </p>
            </div>

            <div className="p-8 sm:p-12">
              {success ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="font-display text-2xl font-normal text-ink mb-2">Check your email</h2>
                  <p className="text-ink/70 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">
                    {successMessage ||
                      `If an account exists for ${email}, we have dispatched a password reset link.`}
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary font-semibold hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-red-700 text-xs sm:text-sm bg-red-50/80 border border-red-200/80 p-4 rounded-2xl">
                      {error}
                    </div>
                  )}
                  <div>
                    <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                      Registered Email Address <span className="text-red-500">*</span>
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
                    <p className="mt-2 font-mono text-[10px] text-ink/50 uppercase">
                      We will transmit a secure recovery token to this address.
                    </p>
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
                        <KeyRound className="w-4 h-4" />
                        <span>SEND RECOVERY LINK</span>
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
