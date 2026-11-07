import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Shield,
  BookOpen,
  HardHat,
  Building,
  Pickaxe,
  GraduationCap,
  Lightbulb,
  Rocket,
  Crown,
  Star,
  Award,
  Target,
  Sparkles,
  Building2,
  UserCheck,
  AlertTriangle,
  Users,
  Globe,
  Quote,
  Loader2,
  CheckCircle,
  X,
  Utensils,
  Anchor,
  Flame,
  Leaf,
  HeartPulse,
  ShieldCheck,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";
import type { Testimonial } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";

const HERO_IMAGES = [
  "/ksohtc-1.webp",
  "/ksohtc-site-visit.webp",
  "/ksohtc-2.webp",
  "/ksohtc-practical-drill.webp",
  "/ksohtc-3.webp",
  "/ksohtc-7.webp"
];
const HERO_INTERVAL_MS = 5000;
const HERO_FADE_DURATION_MS = 1200;

async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await fetch(getApiBase() + "/api/testimonials");
  if (!res.ok) throw new Error("Failed to load testimonials");
  return res.json();
}

export default function Index() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    document.title = "KSOSHTC | Occupational Safety & Health Training Rwanda";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), HERO_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (selectedTestimonial) {
      document.body.style.overflow = "hidden";
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedTestimonial(null);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", onKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedTestimonial]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    setContactSuccess(false);
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim() || !contactMessage.trim()) {
      setContactError("Please fill in name, email, phone, and message.");
      return;
    }
    setContactLoading(true);
    try {
      const res = await fetch(getApiBase() + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          message: contactMessage.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactError((data as { error?: string }).error ?? "Failed to send message. Please try again.");
        return;
      }
      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
    } catch {
      setContactError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
  });

  // Testimonials sorted by newest first
  const displayTestimonials = [...testimonials].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );

  // For continuous right-to-left marquee, build repeated sequence for seamless loop
  const marqueeItems = displayTestimonials.length > 0
    ? displayTestimonials.length < 5
      ? Array.from({ length: Math.ceil(8 / displayTestimonials.length) }, () => displayTestimonials).flat()
      : displayTestimonials
    : [];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      {/* Spacer so content is not hidden under fixed nav */}
      <div className="h-24 sm:h-28 md:h-32 lg:h-36" aria-hidden="true" />

      {/* Hero Section — taller; buttons separated below main content */}
      <section id="home" className="relative text-white py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden min-h-[85vh] sm:min-h-[88vh] flex flex-col justify-between">
        {/* Sliding hero images — crossfade */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((src, i) => (
            <SiteImage
              key={src}
              src={src}
              alt=""
              hero
              priority={i === 0}
              className={`absolute inset-0 w-full h-full object-cover bg-image-animate bg-image-move-endless transition-opacity ease-out ${i === heroIndex ? "opacity-100 z-[0]" : "opacity-0 z-0 pointer-events-none"}`}
              style={{ transitionDuration: `${HERO_FADE_DURATION_MS}ms` }}
              decoding="async"
              aria-hidden
            />
          ))}
          <div className="absolute inset-0 bg-black/50 z-[1]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/60 via-secondary/45 to-primary/50 z-[1]" />
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none z-[2]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary rounded-full blur-3xl animate-float animate-delay-300" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center flex-1 justify-center">
          <div className="w-full max-w-5xl flex flex-col items-center space-y-4 sm:space-y-6">
            <div className="eyebrow eyebrow--light px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm hero-reveal-slow text-animate-fade-in-out" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <span className="eyebrow__rule" />
              <span className="text-brass font-bold text-xs sm:text-sm tracking-widest">Professional OSH Training Institution</span>
            </div>
            <h1 className="font-display font-medium text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.08] text-bone hero-text-line-1 mt-2 sm:mt-4">
              <span className="hero-typing-inner">Kigali Safety OSH Training Center</span>
            </h1>
            <p className="font-display italic text-2xl sm:text-3xl md:text-4xl text-brass tracking-wide hero-text-line-2 pt-2 sm:pt-4">
              Safety today, Prosperity tomorrow.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-stone-200/90 font-sans max-w-2xl leading-relaxed hero-text-line-3 pt-2 sm:pt-4">
              Become safety Manager in <span className="font-semibold text-brass-lt underline decoration-brass/50 decoration-1 underline-offset-4">3 months</span>
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 sm:pb-10 flex flex-col items-center">
          <div className="flex flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/login"
              state={{ from: "/dashboard" }}
              className="group cursor-pointer inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full font-display font-semibold uppercase tracking-wider text-xs sm:text-sm bg-brass text-ink hover:bg-brass-lt transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] shrink-0"
            >
              <span>ENROLL NOW!</span>
              <Target className="w-4 h-4 text-ink btn-arrow-icon" />
            </Link>
            <a
              href="#who"
              className="group cursor-pointer inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full font-display font-semibold uppercase tracking-wider text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-bone border border-white/25 hover:border-white/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] shrink-0"
            >
              <span>Learn More</span>
              <Shield className="w-4 h-4 text-brass btn-arrow-icon" />
            </a>
          </div>
        </div>
      </section>

      {/* Who We Are Section (home) — no background image; sticky so it covers hero when scrolling down; connects to hero with no gap */}
      <section id="who" className="relative sticky top-0 z-20 py-16 sm:py-20 md:py-24 lg:py-28 min-h-[60vh] flex flex-col justify-center overflow-hidden -mt-px bg-[#121815] text-bone border-t border-white/[0.08]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-windy">
          <div className="mb-10 sm:mb-12">
            <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Who We Are</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone">
              Who We Are
            </h2>
            <p className="text-stone-300 text-base sm:text-lg mt-3 sm:mt-4 max-w-2xl leading-relaxed">
              A Rwanda-accredited institution specializing in Occupational Safety and Health (OSH) short-course training.
            </p>
          </div>

          <div className="mb-10 rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 shadow-xl hover:border-brass/40 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <img src="/rtb.webp" alt="RTB Rwanda TVET Board" className="h-24 sm:h-32 w-auto object-contain rounded-xl bg-white p-3 shadow-md" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-brass font-mono font-bold">Rwanda TVET Board</p>
                <p className="mt-2 text-base sm:text-lg md:text-xl text-stone-200 leading-relaxed font-normal">
                  Accredited institution delivering practical and industry-relevant Occupational Safety and Health (OSH) short-course training.
                </p>
              </div>
            </div>
          </div>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-3xl mb-10">
            <span className="font-bold text-bone">KSOSHTC</span> — competent safety professionals for construction, industrial &amp; mining. Structured, regulation-aligned programs.
          </p>

          {/* Description cards — scale in with stagger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-10">
            {[
              { icon: GraduationCap, title: "Safety Supervision", desc: "Labour-aligned education." },
              { icon: Users, title: "Structured Training", desc: "Practice-oriented culture." },
              { icon: Shield, title: "Risk & Incidents", desc: "Fewer accidents, compliance." },
            ].map((item, i) => (
              <div key={i} className="editorial-dark-card flex flex-col sm:flex-row gap-4 p-6 group">
                <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-brass group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-bone mb-1 group-hover:text-brass-lt transition-colors text-base sm:text-lg">{item.title}</p>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Icon cards — clickable to all courses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: HardHat, label: "OSH in Construction", sub: "Construction & infrastructure", slug: "construction" },
              { icon: Building, label: "OSH in Industrial", sub: "Manufacturing & industrial", slug: "industrial-safety" },
              { icon: Pickaxe, label: "OSH in Mining", sub: "Mining & extraction", slug: "mining" },
              { icon: Utensils, label: "Food Safety", sub: "Hygiene & HACCP standards", slug: "food-safety" },
              { icon: ShieldCheck, label: "Safety Management", sub: "General Safety & ISO 45001", slug: "safety-management" },
              { icon: Anchor, label: "Safe Lifting Operations", sub: "Rigging, cranes & hoisting", slug: "safe-lifting-operations" },
              { icon: Flame, label: "Fire Safety and Egress", sub: "Evacuation & fire prevention", slug: "fire-safety-and-egress" },
              { icon: Leaf, label: "ESG & Sustainability", sub: "Governance & compliance", slug: "esg" },
              { icon: HeartPulse, label: "First Aid", sub: "Emergency care & CPR drills", slug: "first-aid" },
              { icon: FileCheck, label: "ISO 45001: OH&SMS", sub: "Occupational Health & Safety", slug: "iso-45001" },
              { icon: Globe, label: "ISO 14011: EMS", sub: "Environmental Management", slug: "iso-14011" },
            ].map((course, idx) => {
              const Icon = course.icon;
              return (
                <Link
                  key={course.slug}
                  to={`/courses/${course.slug}`}
                  className="editorial-dark-card block min-h-[10rem] flex flex-col items-center justify-center p-6 text-center group cursor-pointer"
                >
                  <Icon className="w-9 h-9 text-brass mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto" />
                  <p className="font-display font-semibold text-bone text-base sm:text-lg leading-tight group-hover:text-brass-lt transition-colors">{course.label}</p>
                  <p className="text-xs text-stone-400 mt-1.5">{course.sub}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Provide Section — background image with overlay and text on top */}
      <section id="provide" className="relative py-16 md:py-28 min-h-[50vh] flex flex-col justify-center overflow-hidden text-bone">
        <div className="absolute inset-0">
          <SiteImage src="/ksohtc-3.webp" alt="" hero className="w-full h-full object-cover bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-[#121815]/75 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" aria-hidden="true" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-10 sm:mb-12">
            <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Training Excellence</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone">What We Provide</h2>
            <p className="text-stone-300 text-xs sm:text-sm md:text-base mt-2 max-w-2xl leading-relaxed">Practical OSH for competent professionals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: BookOpen, title: "Structured Programs", desc: "3 months Intensive or Weekend (2 months). Theory + practice." },
              { icon: GraduationCap, title: "Competency-Based", desc: "Risk assessment, case studies." },
              { icon: Lightbulb, title: "Industry-Ready", desc: "Apply safety principles on completion." },
              { icon: Rocket, title: "Career Outcomes", desc: "Officer, Supervisor, Inspector, HSE. Experience: Manager." },
            ].map((item, idx) => (
              <div
                key={idx}
                className="editorial-dark-card flex flex-col sm:flex-row sm:items-start gap-4 p-6 sm:p-7 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-brass flex-shrink-0 group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-semibold text-bone mb-1 sm:mb-1.5 group-hover:text-brass-lt transition-colors">{item.title}</h3>
                  <p className="text-stone-300 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section — warm paper background, editorial cards */}
      <section id="industries" className="py-16 sm:py-20 md:py-24 lg:py-28 bg-[#FCFAF6] border-y border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="eyebrow eyebrow--dark justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Sectors of Expertise</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-ink mb-3 sm:mb-4">Industries We Serve</h2>
            <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto px-2">Specialized training for Rwanda's key sectors</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {[
              { icon: HardHat, name: "OSH in Construction", desc: "Height, scaffolding, PPE. Officer, Supervisor, Inspector.", courseId: "construction" as const },
              { icon: Building, name: "OSH in Industrial", desc: "LOTO, chemical, fire. Officer, HSE Assistant.", courseId: "industrial-safety" as const },
              { icon: Pickaxe, name: "OSH in Mining", desc: "Blasting, ventilation. Mining Officer, Supervisor.", courseId: "mining" as const },
              { icon: Utensils, name: "Food Safety", desc: "HACCP, hygiene standards, food contamination prevention.", courseId: "food-safety" as const },
              { icon: ShieldCheck, name: "Safety Management", desc: "HSE leadership, risk assessment, ISO 45001 compliance.", courseId: "safety-management" as const },
              { icon: Anchor, name: "Safe Lifting Operations", desc: "Rigging, slinging, crane operation safety protocols.", courseId: "safe-lifting-operations" as const },
              { icon: Flame, name: "Fire Safety and Egress", desc: "Emergency evacuation, fire prevention, suppression systems.", courseId: "fire-safety-and-egress" as const },
              { icon: Leaf, name: "ESG Principles", desc: "Sustainability, corporate governance, social responsibility.", courseId: "esg" as const },
              { icon: HeartPulse, name: "First Aid & CPR", desc: "Life saving techniques, casualty management, rapid response.", courseId: "first-aid" as const },
              { icon: FileCheck, name: "ISO 45001 (OH&SMS)", desc: "Occupational health and safety management systems & auditing.", courseId: "iso-45001" as const },
              { icon: Globe, name: "ISO 14011 (EMS)", desc: "Environmental management systems, auditing & compliance.", courseId: "iso-14011" as const },
            ].map((industry, idx) => {
              const Icon = industry.icon;
              return (
                <Link
                  key={industry.courseId}
                  to={`/courses/${industry.courseId}`}
                  className="editorial-card group p-7 sm:p-8 bg-white flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-stone-100/80 border border-black/[0.06] flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-ink mb-2 sm:mb-2.5 group-hover:text-primary transition-colors">{industry.name}</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">{industry.desc}</p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-black/[0.06] flex items-center justify-between text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                    <span>Explore Course</span>
                    <ArrowRight className="w-4 h-4 btn-arrow-icon" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Graduates Training Section — background image with overlay and text on top */}
      <section className="relative py-16 md:py-28 min-h-[50vh] flex flex-col justify-center overflow-hidden text-bone">
        <div className="absolute inset-0">
          <SiteImage src="/what-they-do.webp" alt="" hero className="w-full h-full object-cover bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-[#121815]/80 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" aria-hidden="true" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-10 sm:mb-12">
            <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Career Pathways</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone mb-2">What Our Graduates Are Trained To Do</h2>
            <p className="text-stone-300 text-sm sm:text-base md:text-lg">Essential safety competencies for workplace excellence</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { title: "Safety Officer", desc: "On completion." },
              { title: "Safety Supervisor", desc: "Site/Factory." },
              { title: "Safety Inspector", desc: "Inspections, audits." },
              { title: "HSE Assistant", desc: "HSE support." },
              { title: "Safety Manager", desc: "With experience." },
              { title: "Compliance", desc: "Standards & regulations." },
            ].map((item, idx) => (
              <div
                key={idx}
                className="editorial-dark-card flex gap-4 p-6 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-brass flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-semibold mb-1 text-bone group-hover:text-brass-lt transition-colors">{item.title}</h3>
                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="py-16 sm:py-20 md:py-24 lg:py-28 bg-[#F7F5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 sm:mb-16">
            <div className="eyebrow eyebrow--dark mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Institutional Commitment</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-ink">Our Vision &amp; Mission</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-stretch">
            {/* Mission */}
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="bg-[#121815] text-bone py-5 px-6 sm:px-8 flex items-center justify-between border-b border-white/10">
                <span className="eyebrow eyebrow--light text-brass-lt"><span className="eyebrow__rule" /> Purpose</span>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-bone">Our Mission</h3>
              </div>
              <div className="relative">
                <SiteImage
                  src="/ksohtc-8.webp"
                  alt="KSOSHTC mission in action"
                  className="w-full h-44 sm:h-52 object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  decoding="async"
                />
                <div className="img-overlay" aria-hidden="true" />
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-normal mb-6">
                  To deliver <span className="font-semibold text-primary">high-quality, practical OSH training</span> that develops competent professionals, prevents workplace accidents, strengthens compliance, and promotes a proactive safety culture.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">High-Quality Training</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Practical, industry-aligned OSH education</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Competent Professionals</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Develop safety officers, supervisors, inspectors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Prevent Accidents</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Reduce workplace accidents and hazards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Strengthen Compliance</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Regulatory and international best practices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Proactive Safety Culture</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Across construction, industrial and mining sectors</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="bg-[#121815] text-bone py-5 px-6 sm:px-8 flex items-center justify-between border-b border-white/10">
                <span className="eyebrow eyebrow--light text-brass-lt"><span className="eyebrow__rule" /> Horizon</span>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-bone">Our Vision</h3>
              </div>
              <div className="relative">
                <SiteImage
                  src="/ksohtc-9.webp"
                  alt="KSOSHTC training — our vision"
                  className="w-full h-44 sm:h-52 object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  decoding="async"
                />
                <div className="img-overlay" aria-hidden="true" />
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-normal mb-6">
                  <span className="font-semibold text-primary">Long-term contributor</span> to national safety. Capacity building.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Excellence</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Commitment to highest standards in OSH training and education</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Accreditation</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Recognized certification and regulatory compliance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Star className="w-4 h-4 text-brass" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Industry Impact</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Measurable improvements in workplace safety across Rwanda</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Quality Assurance</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Continuous improvement of training delivery and outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 group/item">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-ink text-sm sm:text-base">Regional Leadership</h4>
                      <p className="text-stone-600 text-xs sm:text-sm mt-0.5">Setting the standard for OSH education across the region</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (admin-managed continuous sliding carousel) */}
      <section id="testimonials" className="py-16 sm:py-20 md:py-24 bg-[#FCFAF6] overflow-hidden relative border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center mb-10 sm:mb-14">
          <div className="text-center w-full max-w-3xl">
            <div className="eyebrow eyebrow--dark justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Verified Experiences</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-ink mb-3 text-center">
              What Our Participants Say
            </h2>
            <p className="text-stone-600 text-base sm:text-lg text-center max-w-2xl mx-auto">
              Stories and feedback from safety professionals who trained with us
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <p className="text-stone-500 text-sm">Loading participant testimonials…</p>
          </div>
        ) : displayTestimonials.length === 0 ? (
          <p className="text-stone-500 text-center py-8">No testimonials yet. Check back soon.</p>
        ) : (
          <div className="relative w-full overflow-hidden pause-marquee group">
            {/* Gradient Edge Masks for smooth fade on sides */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 md:w-36 bg-gradient-to-r from-[#FCFAF6] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 md:w-36 bg-gradient-to-l from-[#FCFAF6] to-transparent z-10" />

            {/* Continuous Marquee Track (Right to Left) */}
            <div className="animate-marquee-left flex items-stretch gap-5 sm:gap-6 px-4 py-4">
              {/* Primary Track */}
              {marqueeItems.map((t, idx) => {
                const PREVIEW_LEN = 120;
                const isLong = t.quote.length > PREVIEW_LEN;
                const preview = isLong ? t.quote.slice(0, PREVIEW_LEN).trimEnd() + "…" : t.quote;
                return (
                  <div
                    key={`track1-${t.id}-${idx}`}
                    className="w-[280px] xs:w-[320px] sm:w-[380px] md:w-[420px] flex-shrink-0 flex flex-col bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 select-none"
                  >
                    {/* Hero image filling top space responsively */}
                    <div className="w-full h-44 xs:h-52 sm:h-60 md:h-64 relative bg-stone-100 overflow-hidden flex-shrink-0">
                      {t.avatarUrl ? (
                        <SiteImage
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                          sizes="(max-width: 640px) 280px, (max-width: 768px) 380px, 420px"
                          cloudinaryMaxWidth={600}
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center text-primary font-display font-bold text-4xl sm:text-5xl">
                          {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">
                      <div className="flex flex-col items-center mb-2.5 sm:mb-3">
                        <h4 className="font-display font-semibold text-ink text-base sm:text-lg md:text-xl text-center leading-snug">{t.name}</h4>
                        <p className="text-primary font-mono font-medium text-xs sm:text-sm uppercase tracking-wider mt-1 text-center">{t.role || "Participant"}</p>
                        {/* Stars */}
                        <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${i < (t.rating ?? 5) ? "fill-brass text-brass" : "fill-stone-200 text-stone-200"}`} />
                          ))}
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="w-10 sm:w-12 h-0.5 bg-primary/20 rounded mx-auto mb-2.5 sm:mb-3" />

                      {/* Truncated Quote */}
                      <p className="text-stone-600 text-xs sm:text-sm md:text-base leading-relaxed italic text-center flex-1">
                        &ldquo;{preview}&rdquo;
                      </p>

                      {/* Read More */}
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setSelectedTestimonial(t)}
                          className="mt-3.5 sm:mt-4 mx-auto inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider font-semibold hover:bg-primary hover:text-white transition-all duration-200 cursor-pointer"
                        >
                          Read More
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Duplicate Track for Seamless Infinite Loop */}
              {marqueeItems.map((t, idx) => {
                const PREVIEW_LEN = 120;
                const isLong = t.quote.length > PREVIEW_LEN;
                const preview = isLong ? t.quote.slice(0, PREVIEW_LEN).trimEnd() + "…" : t.quote;
                return (
                  <div
                    key={`track2-${t.id}-${idx}`}
                    aria-hidden="true"
                    className="w-[280px] xs:w-[320px] sm:w-[380px] md:w-[420px] flex-shrink-0 flex flex-col bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 select-none"
                  >
                    {/* Hero image filling top space responsively */}
                    <div className="w-full h-44 xs:h-52 sm:h-60 md:h-64 relative bg-stone-100 overflow-hidden flex-shrink-0">
                      {t.avatarUrl ? (
                        <SiteImage
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                          sizes="(max-width: 640px) 280px, (max-width: 768px) 380px, 420px"
                          cloudinaryMaxWidth={600}
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center text-primary font-display font-bold text-4xl sm:text-5xl">
                          {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">
                      <div className="flex flex-col items-center mb-2.5 sm:mb-3">
                        <h4 className="font-display font-semibold text-ink text-base sm:text-lg md:text-xl text-center leading-snug">{t.name}</h4>
                        <p className="text-primary font-mono font-medium text-xs sm:text-sm uppercase tracking-wider mt-1 text-center">{t.role || "Participant"}</p>
                        <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${i < (t.rating ?? 5) ? "fill-brass text-brass" : "fill-stone-200 text-stone-200"}`} />
                          ))}
                        </div>
                      </div>

                      <div className="w-10 sm:w-12 h-0.5 bg-primary/20 rounded mx-auto mb-2.5 sm:mb-3" />

                      <p className="text-stone-600 text-xs sm:text-sm md:text-base leading-relaxed italic text-center flex-1">
                        &ldquo;{preview}&rdquo;
                      </p>

                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setSelectedTestimonial(t)}
                          className="mt-3.5 sm:mt-4 mx-auto inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider font-semibold hover:bg-primary hover:text-white transition-all duration-200 cursor-pointer"
                        >
                          Read More
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle notice below marquee */}
            <p className="text-center text-xs text-stone-400 mt-4 select-none font-mono">
              Hover over testimonials to pause scrolling
            </p>
          </div>
        )}
      </section>

      {/* ===== TESTIMONIAL LIGHTBOX MODAL (ULTRA RESPONSIVE) ===== */}
      {selectedTestimonial && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8"
          onClick={() => setSelectedTestimonial(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Testimonial from ${selectedTestimonial.name}`}
        >
          {/* Blurred backdrop covering entire screen */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          {/* Expanded card filling the space responsively */}
          <div
            className="relative z-10 bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[96vw] max-w-[1650px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 fade-in duration-300 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (always accessible and visible) */}
            <button
              type="button"
              onClick={() => setSelectedTestimonial(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/95 hover:bg-red-50 hover:text-red-600 text-gray-700 shadow-md backdrop-blur-md border border-gray-200/50 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left/Top side: Image filling the space responsively */}
            <div className="w-full md:w-5/12 lg:w-1/2 h-56 xs:h-64 sm:h-80 md:h-auto md:min-h-[500px] relative bg-gray-100 overflow-hidden flex-shrink-0">
              {selectedTestimonial.avatarUrl ? (
                <SiteImage
                  src={selectedTestimonial.avatarUrl}
                  alt={selectedTestimonial.name}
                  className="w-full h-full object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  cloudinaryMaxWidth={1200}
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-5xl sm:text-6xl md:text-7xl">
                  {selectedTestimonial.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}
            </div>

            {/* Right/Bottom side: Information and full testimonial quote */}
            <div className="p-5 sm:p-8 md:p-10 lg:p-14 xl:p-16 flex-1 flex flex-col justify-between md:overflow-y-auto md:max-h-[90vh]">
              <div>
                {/* Participant Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pr-10 sm:pr-12">
                  <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                      {selectedTestimonial.name}
                    </h3>
                    <p className="text-primary font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider mt-1">
                      {selectedTestimonial.role || "Participant"}
                    </p>
                  </div>
                  {/* Star ratings */}
                  <div className="flex items-center gap-1 self-start sm:self-auto">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          i < (selectedTestimonial.rating ?? 5)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-16 sm:w-20 h-1 bg-primary/25 rounded-full my-4 sm:my-6" />

                {/* Full quote */}
                <div className="relative">
                  <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20 mb-2 sm:mb-3" />
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed italic">
                    &ldquo;{selectedTestimonial.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Bottom Footer Bar */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">KSOSHTC Training Platform</span>
                <button
                  type="button"
                  onClick={() => setSelectedTestimonial(null)}
                  className="px-6 py-2 sm:px-8 sm:py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white font-semibold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 md:py-24 bg-white border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="text-center mb-12 sm:mb-16 w-full max-w-3xl">
            <div className="eyebrow eyebrow--dark justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Answers &amp; Guidance</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-ink mb-3 text-center">Frequently Asked Questions</h2>
            <p className="text-stone-600 text-base sm:text-lg text-center max-w-2xl mx-auto">OSH training and enrollment</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-5xl mx-auto">
            {[
              { q: "What is OSH training?", a: "Occupational Safety and Health (OSH) training prepares professionals to identify hazards, assess risks, and implement safety measures in workplaces. Our programs align with Rwanda Labour Regulations and international best practices." },
              { q: "Who can enroll?", a: "A2 is the minimum. Individuals and corporate clients can enroll. Contact us for details." },
              { q: "Where are trainings held?", a: "We are based at Kicukiro, Kigali, Rwanda. Trainings can be held on-site or at your organization's premises for group enrollments." },
              { q: "Are certificates issued?", a: "Yes. Successful participants receive certificates of completion. Our programs are designed to support recognition and accreditation in line with national and industry standards." },
              { q: "How do I enroll or get a quote?", a: "Use the contact form below, WhatsApp +250 785 072 512, or email ksoshtc@gmail.com. We will respond with enrollment steps or a tailored quote for your organization." },
              { q: "What sectors do you train for?", a: "Occupational Safety and Health in Construction Management (OSH in Construction), Occupational Safety and Health in Industrial Management (OSH in Industrial), and Occupational Safety and Health in Mining (OSH in Mining)." },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group bg-[#FCFAF6] rounded-xl border border-black/[0.08] overflow-hidden shadow-xs hover:border-black/20 transition-all duration-300"
              >
                <summary className="flex items-start sm:items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-display font-medium text-stone-900 hover:text-primary transition-colors min-h-[3.75rem]">
                  <span className="text-left text-sm sm:text-base leading-snug flex-1 pr-2">{faq.q}</span>
                  <span className="text-primary font-mono text-xl shrink-0 transition-transform duration-300 group-open:rotate-45 flex items-center justify-center w-6 h-6 rounded-full bg-black/[0.04]">+</span>
                </summary>
                <p className="px-6 pb-6 pt-1 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-black/[0.06] bg-white/60">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section — premium styling, depth and form focus */}
      <section id="contact" className="relative py-16 sm:py-20 md:py-28 bg-[#121815] text-bone overflow-hidden border-t border-white/[0.08]">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" aria-hidden />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="eyebrow eyebrow--light justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Inquiries &amp; Admissions</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone mb-3 text-center">Get In Touch</h2>
            <p className="text-stone-300 text-base sm:text-lg text-center max-w-2xl mx-auto">Questions? We’re here to help.</p>
          </div>

          {/* One big card: left = contact info, right = form */}
          <div className="bg-[#18201C] rounded-2xl border border-white/[0.12] shadow-2xl w-full overflow-hidden mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
              {/* Left half: contact cards stacked */}
              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 bg-white/[0.02] border-b lg:border-b-0 lg:border-r border-white/10">
                <h3 className="font-display font-semibold text-bone text-lg sm:text-xl mb-6">Contact us</h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: MapPin,
                      title: "Address",
                      content: "Kicukiro, Kigali, Rwanda",
                      link: "/contact#map",
                    },
                    {
                      icon: Phone,
                      title: "Phone / WhatsApp",
                      content: "+250 785 072 512",
                      link: "https://wa.me/250785072512",
                    },
                    {
                      icon: Mail,
                      title: "Email",
                      content: "ksoshtc@gmail.com",
                      link: "mailto:ksoshtc@gmail.com",
                    },
                  ].map((contact, idx) => {
                    const Icon = contact.icon;
                    const isAddress = contact.content === "Kicukiro, Kigali, Rwanda" && contact.link === "/contact#map";
                    const content = (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-brass flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-bone group-hover:text-brass-lt transition-colors text-sm sm:text-base">{contact.title}</h4>
                          <p className="text-stone-300 text-sm mt-0.5">
                            {contact.link ? (
                              contact.link.startsWith("http") || contact.link.startsWith("mailto:") ? (
                                <a
                                  href={contact.link}
                                  className="text-stone-300 hover:text-brass-lt underline decoration-dotted underline-offset-2 transition-colors"
                                  {...(contact.link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contact.content}
                                </a>
                              ) : (
                                <span className="text-stone-300">{contact.content} — View map</span>
                              )
                            ) : (
                              contact.content
                            )}
                          </p>
                        </div>
                      </>
                    );
                    const blockClass = "flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.04] transition-colors group";
                    return (
                      <div key={idx}>
                        {isAddress ? (
                          <Link to="/contact#map" className={`block ${blockClass}`}>
                            {content}
                          </Link>
                        ) : (
                          <div className={blockClass}>{content}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right half: form */}
              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
                <p className="font-display font-semibold text-bone text-base sm:text-lg mb-5">Send us a message</p>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    aria-label="Your Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-stone-400 focus:outline-none focus:border-brass focus:bg-white/[0.08] focus:ring-1 focus:ring-brass/30 transition-all text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    aria-label="Your Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-stone-400 focus:outline-none focus:border-brass focus:bg-white/[0.08] focus:ring-1 focus:ring-brass/30 transition-all text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    aria-label="Phone number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-stone-400 focus:outline-none focus:border-brass focus:bg-white/[0.08] focus:ring-1 focus:ring-brass/30 transition-all text-sm"
                  />
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    aria-label="Your Message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-stone-400 focus:outline-none focus:border-brass focus:bg-white/[0.08] focus:ring-1 focus:ring-brass/30 transition-all text-sm resize-none"
                  />
                  {contactError && <p className="text-red-400 text-sm">{contactError}</p>}
                  {contactSuccess && (
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Message sent. We will get back to you soon.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-brass text-ink hover:bg-brass-lt font-display font-semibold uppercase tracking-wider text-xs sm:text-sm py-4 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {contactLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Send Message</span>
                    <ArrowRight className="w-4 h-4 text-ink btn-arrow-icon" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-brass text-ink hover:bg-brass-lt px-10 sm:px-12 py-4 rounded-full font-display font-semibold uppercase tracking-wider text-xs sm:text-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] group cursor-pointer"
            >
              <span>ENROLL NOW!</span>
              <Target className="w-4 h-4 text-ink btn-arrow-icon" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
