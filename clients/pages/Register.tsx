import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { User, Building2, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { setStoredUser } from "../lib/auth";
import { setAdminSessionToken } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";

/** Value sent to API: determines which courses the learner will see (sector course + safety-management). */
const SECTOR_OPTIONS: { value: "" | "construction" | "industrial-safety" | "mining"; label: string }[] = [
  { value: "", label: "Select your sector (or Other to see all courses)" },
  { value: "construction", label: "Construction" },
  { value: "industrial-safety", label: "Industrial Safety" },
  { value: "mining", label: "Mining" },
];
const COUNTRIES = ["Rwanda", "Uganda", "Kenya", "Tanzania", "Burundi", "Other"];

export default function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Register | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [sector, setSector] = useState<"" | "construction" | "industrial-safety" | "mining">("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiBase() + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          phone: phone.trim(),
          organization: organization || undefined,
          sector: sector || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMessage = (data as { error?: string }).error;
        if (res.status === 404) {
          setError("Registration service is unavailable. Please try again later or contact support.");
        } else if (res.status === 409 || res.status === 400) {
          setError(serverMessage ?? "Registration failed. This email may already be registered.");
        } else {
          setError(serverMessage ?? "Registration failed. Please try again.");
        }
        return;
      }
      const user = (data as { user?: unknown }).user;
      if (user && typeof user === "object" && "id" in user) {
        setAdminSessionToken(null);
        setStoredUser(user as Parameters<typeof setStoredUser>[0]);
        navigate("/courses");
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
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[30px] shadow-xl border border-gray-200 overflow-hidden scroll-reveal reveal-scale">
            <div className="w-full bg-primary text-white px-6 sm:px-8 md:px-10 py-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Create an account</h1>
              <p className="mt-2 text-primary-foreground/90 text-sm sm:text-base max-w-2xl">
                Register to enroll. You will be able to access courses after an admin approves your account.
              </p>
            </div>

            <div className="p-6 sm:p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {error && (
                  <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Personal information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jean Claude Habimana"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
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
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+250 7XX XXX XXX"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Country
                      </label>
                      <select
                        id="country"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Professional details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Organization / Company
                      </label>
                      <input
                        id="organization"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Employer or institution name"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role / Job title
                      </label>
                      <input
                        id="role"
                        type="text"
                        placeholder="e.g. Site Supervisor, Safety Officer"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Industry / Sector of interest
                      </label>
                      <select
                        id="sector"
                        value={sector}
                        onChange={(e) => setSector(e.target.value as "" | "construction" | "industrial-safety" | "mining")}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                      >
                        {SECTOR_OPTIONS.map((opt) => (
                          <option key={opt.value || "other"} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        You will see courses for your sector plus Safety Management. Leave as Other to see all.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Security
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repeat password"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold text-primary hover:underline">Terms &amp; Conditions</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>
                    {" "}and understand that my account must be approved by an admin before I can access courses.
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent/80 text-black font-bold py-3.5 px-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Create account
                      </>
                    )}
                  </button>
                  <Link
                    to="/courses"
                    className="flex-1 text-center py-3.5 px-6 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary transition-colors"
                  >
                    View courses first
                  </Link>
                </div>
              </form>

              <p className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:text-primary/80 underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}