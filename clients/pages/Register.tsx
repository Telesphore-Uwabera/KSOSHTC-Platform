import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { User, Building2, Lock, ShieldCheck, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { setStoredUser } from "../lib/auth";
import { clearAdminSessionPolicy, setAdminSessionToken } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";
import type { LearnerSector } from "@shared/api";

/** Value sent to API: determines which courses the learner will see (sector course + safety-management). */
const SECTOR_OPTIONS: { value: "" | LearnerSector; label: string }[] = [
  { value: "", label: "Select your sector (or Other to see all courses)" },
  { value: "construction", label: "Construction" },
  { value: "industrial-safety", label: "Industrial Safety" },
  { value: "mining", label: "Mining" },
  { value: "food-safety", label: "Food Safety" },
  { value: "safety-management", label: "Safety Management" },
  { value: "safe-lifting-operations", label: "Safe Lifting Operations" },
  { value: "fire-safety-and-egress", label: "Fire Safety & Egress" },
  { value: "esg", label: "ESG Principles" },
  { value: "first-aid", label: "First Aid & CPR" },
  { value: "iso-45001", label: "ISO 45001: OH&SMS" },
  { value: "iso-14011", label: "ISO 14011: EMS" },
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
  const [sector, setSector] = useState<"" | LearnerSector>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          organization: organization.trim(),
          sector: sector || undefined,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string }).error;
        if (res.status === 409 || (msg && msg.toLowerCase().includes("already registered"))) {
          setError("An account with this email already exists. Please use a different email or log in.");
        } else {
          setError(msg || "Registration failed. Please try again.");
        }
        return;
      }
      clearAdminSessionPolicy();
      setAdminSessionToken(null);
      const user = (data as { user?: unknown }).user;
      if (user && typeof user === "object" && "id" in user) {
        setStoredUser(user as Parameters<typeof setStoredUser>[0]);
        navigate("/dashboard", { replace: true });
      }
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
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[32px] shadow-2xl border border-black/[0.08] overflow-hidden">
            {/* Obsidian Editorial Header */}
            <div className="w-full bg-[#121815] text-bone px-8 sm:px-12 py-10 border-b border-white/10">
              <div className="eyebrow eyebrow--light mb-3">
                <span className="text-brass">KSOSHTC</span>
                <span className="eyebrow__rule" />
                <span>STUDENT ENROLLMENT</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-bone tracking-tight">
                Create an <span className="font-serif italic text-accent font-normal">Account</span>
              </h1>
              <p className="mt-2 text-bone/70 text-sm font-light max-w-xl">
                Register to enroll. You will be able to access course materials and assessments once an administrator approves your account.
              </p>
            </div>

            <div className="p-8 sm:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="text-red-700 text-xs sm:text-sm bg-red-50/80 border border-red-200/80 p-4 rounded-2xl">
                    {error}
                  </div>
                )}

                <div>
                  <div className="eyebrow eyebrow--dark mb-4">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>01 // PERSONAL INFORMATION</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jean Claude Habimana"
                        required
                        className={inputStyle}
                      />
                    </div>
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
                        autoComplete="email"
                        className={inputStyle}
                      />
                      <p className="mt-1.5 font-mono text-[10px] text-ink/50 uppercase">One account per email; duplicates rejected.</p>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+250 7XX XXX XXX"
                        required
                        className={inputStyle}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="country" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Country of Residence
                      </label>
                      <select
                        id="country"
                        className={inputStyle + " bg-bone"}
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
                  <div className="eyebrow eyebrow--dark mb-4">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>02 // PROFESSIONAL DETAILS</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="organization" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Organization / Employer
                      </label>
                      <input
                        id="organization"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Employer or company name"
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Job Title / Role
                      </label>
                      <input
                        id="role"
                        type="text"
                        placeholder="e.g. Site Supervisor, Safety Officer"
                        className={inputStyle}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="sector" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Industry / Sector of Interest
                      </label>
                      <select
                        id="sector"
                        value={sector}
                        onChange={(e) => setSector(e.target.value as "" | LearnerSector)}
                        className={inputStyle + " bg-bone"}
                      >
                        {SECTOR_OPTIONS.map((opt) => (
                          <option key={opt.value || "other"} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="font-mono text-[10px] text-ink/50 uppercase mt-1.5">
                        You will see courses for your sector plus Safety Management. Leave as Other to see all.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="eyebrow eyebrow--dark mb-4">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>03 // ACCOUNT SECURITY</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          placeholder="Min. 8 characters"
                          required
                          minLength={8}
                          className={inputStyle + " pr-12"}
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
                    <div>
                      <label htmlFor="confirm" className="block font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2 font-semibold">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirm"
                          type={showConfirm ? "text" : "password"}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Repeat password"
                          required
                          className={inputStyle + " pr-12"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 rounded border border-black/20 text-primary focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-xs text-ink/70 leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold text-primary hover:underline">Terms &amp; Conditions</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>
                    {" "}and understand that my account must be approved by an administrator before I can access course materials.
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-black/[0.08]">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-3 bg-accent text-[#121815] font-semibold py-4 px-6 rounded-full shadow-lg hover:shadow-xl hover:bg-accent-light transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>CREATE ACCOUNT</span>
                        <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center ml-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </>
                    )}
                  </button>
                  <Link
                    to="/courses"
                    className="flex-1 text-center py-4 px-6 rounded-full font-medium border border-black/15 text-ink hover:bg-black/5 transition-colors text-sm"
                  >
                    View Courses First
                  </Link>
                </div>
              </form>

              <p className="mt-10 pt-6 border-t border-black/[0.08] text-center text-ink/70 text-xs">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in here
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
