import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { KeyRound, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="w-full min-h-[calc(100vh-6rem)] py-12 sm:py-16 md:py-24 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[30px] shadow-xl border border-gray-200 overflow-hidden">
            <div className="w-full bg-primary text-white px-6 sm:px-8 py-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
                <KeyRound className="w-6 h-6" />
                Reset Password
              </h1>
              <p className="mt-2 text-primary-foreground/90 text-sm sm:text-base">
                Enter your email address to receive a recovery link.
              </p>
            </div>

            <div className="p-6 sm:p-8 md:p-10">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                  <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                    {successMessage ||
                      `If an account exists for ${email}, we have sent a password reset link to it.`}
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                  )}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
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
                    <p className="mt-2 text-xs text-gray-500">
                      We'll send you a secure link to set your new password.
                    </p>
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
                        <KeyRound className="w-5 h-5" />
                        Send recovery link
                      </>
                    )}
                  </button>

                  <div className="pt-4 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
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
