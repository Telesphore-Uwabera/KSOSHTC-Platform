import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Phone, Mail, Shield, BookOpen, HardHat, Building, Pickaxe, GraduationCap, Lightbulb, Rocket, Crown, Star, Award, Target, Sparkles, Building2, UserCheck, AlertTriangle, Users, Globe, Quote, Loader2, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { Testimonial } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";

const HERO_IMAGES = ["/ksohtc-1.webp", "/ksohtc-2.webp", "/ksohtc-3.webp", "/ksohtc-7.webp"];
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

  useEffect(() => {
    document.title = "KSOSHTC | Occupational Safety & Health Training Rwanda";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), HERO_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

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
  // Website shows only the latest 3 testimonials; layout 3 cols (lg) / 1 col (md/sm)
  const latestTestimonials = [...testimonials]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 3);

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
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover bg-image-animate bg-image-move-endless transition-opacity ease-out ${i === heroIndex ? "opacity-100 z-[0]" : "opacity-0 z-0 pointer-events-none"}`}
              style={{ transitionDuration: `${HERO_FADE_DURATION_MS}ms` }}
              loading={i === 0 ? "eager" : "lazy"}
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
          <div className="w-full max-w-7xl flex flex-col items-center space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 bg-accent/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hero-reveal-slow text-animate-fade-in-out" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              <span className="text-accent font-semibold text-xs sm:text-sm">Professional OSH Training Institution</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight hero-text-line-1 sm:whitespace-nowrap mt-2 sm:mt-4">
              <span className="hero-typing-inner">Kigali Safety OSH Training Center</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-accent font-bold hero-text-line-2 pt-4 sm:pt-6 lg:pt-8">
              Safety today, Prosperity tomorrow.
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 w-full max-w-full leading-relaxed hero-text-line-3 pt-4 sm:pt-6 lg:pt-8">
              Become safety Manager in <span className="font-bold text-accent drop-shadow-sm">3 months</span>
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 flex flex-col items-center">
          <div className="flex flex-row flex-nowrap gap-4 sm:gap-6">
            <Link
              to={{ pathname: "/login", state: { from: "/dashboard" } }}
              className="group cursor-pointer bg-transparent border-2 border-white text-white px-6 py-4 sm:px-8 sm:py-5 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 hover:bg-white hover:text-primary hover:scale-105 hover:shadow-xl hover:border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.98] inline-flex items-center justify-center shrink-0 min-h-[3.25rem] sm:min-h-[3.75rem]"
            >
              ENROLL NOW!
              <Target className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#who"
              className="group cursor-pointer bg-transparent border-2 border-white text-white px-6 py-4 sm:px-8 sm:py-5 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 hover:bg-white hover:text-primary hover:scale-105 hover:shadow-xl hover:border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.98] inline-flex items-center justify-center shrink-0 min-h-[3.25rem] sm:min-h-[3.75rem]"
            >
              Learn More
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Who We Are Section (home) — no background image; sticky so it covers hero when scrolling down; connects to hero with no gap */}
      <section id="who" className="relative sticky top-0 z-20 py-16 sm:py-20 md:py-24 lg:py-28 min-h-[60vh] flex flex-col justify-center overflow-hidden -mt-px bg-gradient-to-br from-primary to-primary/90 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-windy">
          <div className="mb-8 sm:mb-10">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg mb-3 sm:mb-4 shadow-lg scroll-reveal reveal-flip border border-white/20">
              <h2 className="section-header text-white">Who We Are</h2>
            </div>
            <p className="text-white/90 text-base sm:text-lg mt-3 sm:mt-4 max-w-2xl scroll-reveal text-reveal-fade" style={{ animationDelay: "0.15s" }}>A Professional Occupational Safety and Health (OSH) Training Institution</p>
          </div>

          <p className="text-white/95 text-sm sm:text-base leading-relaxed max-w-3xl mb-8 scroll-reveal reveal-spring delay-1200">
            <span className="font-bold text-white">KSOSHTC</span> — competent safety professionals for construction, industrial & mining. Structured, regulation-aligned programs.
          </p>

          {/* Description cards — scale in with stagger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-8">
            {[
              { icon: GraduationCap, title: "Safety Supervision", desc: "Labour-aligned education.", bg: "bg-accent/20" },
              { icon: Users, title: "Structured Training", desc: "Practice-oriented culture.", bg: "bg-white/20" },
              { icon: Shield, title: "Risk & Incidents", desc: "Fewer accidents, compliance.", bg: "bg-secondary/20" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 p-5 rounded-[30px] border border-white/20 hover:border-white/40 hover:bg-white/10 bg-white/10 backdrop-blur-sm transition-all duration-300 group scroll-reveal reveal-bounce" style={{ animationDelay: `${1.4 + i * 0.25}s` }}>
                <span className={`flex-shrink-0 w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-accent group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-white mb-1 group-hover:text-accent transition-colors text-sm sm:text-base">{item.title}</p>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Icon cards (Construction, Industrial, Mining) — clickable to course pages */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <Link to="/courses/construction" className="block bg-white/10 backdrop-blur-sm rounded-[30px] min-h-[12rem] flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 group cursor-pointer border-2 border-white/20 hover:border-white/40 scroll-reveal reveal-rotate-in delay-2200">
              <div className="text-center p-4">
                <HardHat className="w-12 h-12 sm:w-14 sm:h-14 text-accent mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto" />
                <p className="font-bold text-white text-base sm:text-lg">OSH in Construction</p>
                <p className="text-sm text-white/80">Construction & infrastructure</p>
              </div>
            </Link>
            <Link to="/courses/industrial-safety" className="block bg-white/10 backdrop-blur-sm rounded-[30px] min-h-[12rem] flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 group cursor-pointer border-2 border-white/20 hover:border-white/40 scroll-reveal reveal-rotate-in delay-2500">
              <div className="text-center p-4">
                <Building className="w-12 h-12 sm:w-14 sm:h-14 text-accent mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto" />
                <p className="font-bold text-white text-base sm:text-lg">OSH in Industrial</p>
                <p className="text-sm text-white/80">Manufacturing & industrial</p>
              </div>
            </Link>
            <Link to="/courses/mining" className="block bg-white/10 backdrop-blur-sm rounded-[30px] min-h-[12rem] flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300 group cursor-pointer border-2 border-white/20 hover:border-white/40 scroll-reveal reveal-rotate-in delay-2800">
              <div className="text-center p-4">
                <Pickaxe className="w-12 h-12 sm:w-14 sm:h-14 text-accent mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto" />
                <p className="font-bold text-white text-base sm:text-lg">OSH in Mining</p>
                <p className="text-sm text-white/80">Mining & extraction</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Provide Section — background image with overlay and text on top */}
      <section id="provide" className="relative py-16 md:py-28 min-h-[50vh] flex flex-col justify-center overflow-hidden text-white">
        <div className="absolute inset-0">
          <img src="/ksohtc-3.webp" alt="" className="w-full h-full object-cover bg-image-animate bg-image-move-endless" loading="lazy" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/70" aria-hidden="true" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-10">
            <div className="inline-block bg-secondary/90 backdrop-blur-sm text-white px-8 py-3 rounded-lg mb-4 shadow-lg scroll-reveal reveal-bounce">
              <h2 className="section-header text-white">What We Provide</h2>
            </div>
            <p className="text-white/90 text-xs sm:text-sm mt-2 max-w-2xl scroll-reveal text-reveal-fade drop-shadow" style={{ animationDelay: "0.2s" }}>Practical OSH for competent professionals.</p>
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
                className="flex flex-col sm:flex-row sm:items-start gap-3 p-5 sm:p-6 bg-white/10 backdrop-blur-sm rounded-[30px] border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] scroll-reveal reveal-spring"
                style={{ animationDelay: `${1.2 + idx * 0.3}s` }}
              >
                <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0 hover:scale-125 transition-transform duration-300" />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-white/90 text-sm sm:text-base">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section — white background, no images */}
      <section id="industries" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4 scroll-reveal reveal-flip">Industries We Serve</h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-2 scroll-reveal text-reveal-fade" style={{ animationDelay: "0.15s" }}>Specialized training for Rwanda's key sectors</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: HardHat, name: "OSH in Construction", desc: "Height, scaffolding, PPE. Officer, Supervisor, Inspector.", courseId: "construction" as const },
              { icon: Building, name: "OSH in Industrial", desc: "LOTO, chemical, fire. Officer, HSE Assistant.", courseId: "industrial-safety" as const },
              { icon: Pickaxe, name: "OSH in Mining", desc: "Blasting, ventilation. Mining Officer, Supervisor.", courseId: "mining" as const },
            ].map((industry, idx) => {
              const Icon = industry.icon;
              return (
                <Link
                  key={industry.courseId}
                  to={`/courses/${industry.courseId}`}
                  className={`block bg-gray-50 rounded-[30px] text-center border-2 border-primary/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.99] group cursor-pointer scroll-reveal ${idx === 0 ? "reveal-flip" : idx === 1 ? "reveal-bounce" : "reveal-spring"}`}
                  style={{ animationDelay: `${1.3 + idx * 0.35}s` }}
                >
                  <div className="p-8">
                    <Icon className="w-16 h-16 text-primary mb-4 inline-block group-hover:scale-125 transition-transform duration-300" />
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2 sm:mb-3 group-hover:text-accent transition-colors">{industry.name}</h3>
                    <p className="text-gray-600 text-sm sm:text-base group-hover:text-gray-800 transition-colors leading-snug">{industry.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Graduates Training Section — background image with overlay and text on top */}
      <section className="relative py-16 md:py-28 min-h-[50vh] flex flex-col justify-center overflow-hidden text-white">
        <div className="absolute inset-0">
          <img src="/ksohtc-7.webp" alt="" className="w-full h-full object-cover bg-image-animate bg-image-move-endless" loading="lazy" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/70" aria-hidden="true" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-10">
            <h2 className="section-header text-white mb-2 text-xl sm:text-2xl md:text-3xl scroll-reveal reveal-bounce drop-shadow-md">What Our Graduates Are Trained To Do</h2>
            <p className="text-white/90 text-sm sm:text-base md:text-lg scroll-reveal text-reveal-fade drop-shadow" style={{ animationDelay: "0.2s" }}>Essential safety competencies for workplace excellence</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
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
                className="flex gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-[30px] hover:bg-white/20 border border-white/10 transition-all duration-300 hover:scale-[1.02] scroll-reveal reveal-spring"
                style={{ animationDelay: `${1.2 + idx * 0.15}s` }}
              >
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 hover:scale-110 transition-transform" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 text-white hover:text-accent transition-colors">{item.title}</h3>
                  <p className="text-white/90 text-xs sm:text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section — left/right slow with long delay; sway on Mission card */}
      <section id="mission" className="py-16 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary scroll-reveal reveal-rotate-in">Our Vision & Mission</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Mission */}
            <div className="bg-white rounded-[30px] shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 scroll-reveal reveal-rotate-in delay-600 animate-sway">
              <div className="bg-gradient-to-r from-secondary to-secondary/80 text-white py-8 px-8">
                <h3 className="section-header text-white">Our Mission</h3>
              </div>
              <div className="relative">
                <img
                  src="/ksohtc-8.webp"
                  alt="KSOSHTC mission in action"
                  className="w-full h-36 sm:h-44 object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="img-overlay" aria-hidden="true" />
              </div>
              <div className="p-6 sm:p-8 pt-5 sm:pt-6">
                <p className="text-sm text-gray-700 leading-relaxed font-medium mb-5">
                  To deliver <span className="font-bold text-primary">high-quality, practical OSH training</span> that develops competent professionals, prevents workplace accidents, strengthens compliance, and promotes a proactive safety culture.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group">
                    <Award className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">High-Quality Training</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Practical, industry-aligned OSH education</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <UserCheck className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Competent Professionals</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Develop safety officers, supervisors, inspectors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Prevent Accidents</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Reduce workplace accidents and hazards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Strengthen Compliance</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Regulatory and international best practices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <Users className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Proactive Safety Culture</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Across construction, industrial and mining sectors</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-[30px] shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 scroll-reveal reveal-flip delay-1000">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8 px-8">
                <h3 className="section-header text-white">Our Vision</h3>
              </div>
              <div className="relative">
                <img
                  src="/ksohtc-9.webp"
                  alt="KSOSHTC training — our vision"
                  className="w-full h-36 sm:h-44 object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="img-overlay" aria-hidden="true" />
              </div>
              <div className="p-6 sm:p-8 pt-5 sm:pt-6">
                <p className="text-sm text-gray-700 leading-relaxed font-medium mb-5">
                  <span className="font-bold text-primary">Long-term contributor</span> to national safety. Capacity building.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group">
                    <Crown className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Excellence</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Commitment to highest standards in OSH training and education</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <Star className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Accreditation</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Recognized certification and regulatory compliance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <Star className="w-6 h-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Industry Impact</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Measurable improvements in workplace safety across Rwanda</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <Target className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Quality Assurance</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Continuous improvement of training delivery and outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <Globe className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Regional Leadership</h4>
                      <p className="text-gray-600 text-sm mt-0.5">Setting the standard for OSH education across the region</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (admin-managed) */}
      <section id="testimonials" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="text-center mb-10 sm:mb-14 w-full max-w-3xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 scroll-reveal reveal-bounce">What Our Participants Say</h2>
            <p className="text-gray-600 text-base sm:text-lg scroll-reveal text-reveal-fade" style={{ animationDelay: "0.15s" }}>Stories from professionals who trained with us</p>
          </div>
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Loading testimonials…</p>
          ) : latestTestimonials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No testimonials yet. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
              {latestTestimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className={`bg-white rounded-[30px] border-2 border-gray-200 p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 scroll-reveal ${idx === 0 ? "reveal-flip" : idx === 1 ? "reveal-bounce" : "reveal-spring"}`}
                  style={{ animationDelay: `${0.1 + idx * 0.08}s` }}
                >
                  <Quote className="w-6 h-6 text-primary/60 mb-3" />
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <p className="text-gray-500 text-sm">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="text-center mb-10 sm:mb-14 w-full max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2 scroll-reveal reveal-fade-scale">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-xs sm:text-sm scroll-reveal text-reveal-fade" style={{ animationDelay: "0.15s" }}>OSH training and enrollment</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full max-w-5xl mx-auto">
            {[
              { q: "What is OSH training?", a: "Occupational Safety and Health (OSH) training prepares professionals to identify hazards, assess risks, and implement safety measures in workplaces. Our programs align with Rwanda Labour Regulations and international best practices." },
              { q: "Who can enroll?", a: "A2 is the minimum. Individuals and corporate clients can enroll. Contact us for details." },
              { q: "Where are trainings held?", a: "We are based at Kicukiro, Kigali, Rwanda. Trainings can be held on-site or at your organization's premises for group enrollments." },
              { q: "Are certificates issued?", a: "Yes. Successful participants receive certificates of completion. Our programs are designed to support recognition and accreditation in line with national and industry standards." },
              { q: "How do I enroll or get a quote?", a: "Use the contact form below, WhatsApp +250 785 072 512, or email kigalisafetyoshtrainingcenter@gmail.com. We will respond with enrollment steps or a tailored quote for your organization." },
              { q: "What sectors do you train for?", a: "Occupational Safety and Health in Construction Management (OSH in Construction), Occupational Safety and Health in Industrial Management (OSH in Industrial), and Occupational Safety and Health in Mining (OSH in Mining)." },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white rounded-[30px] border-2 border-gray-200 overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 scroll-reveal reveal-fade-scale"
                style={{ animationDelay: `${0.2 + idx * 0.06}s` }}
              >
                <summary className="flex items-start sm:items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 cursor-pointer list-none font-semibold text-gray-800 hover:text-primary transition-colors min-h-[3.5rem]">
                  <span className="text-left text-sm sm:text-base line-clamp-2 flex-1 pr-2">{faq.q}</span>
                  <span className="text-primary text-xl sm:text-2xl shrink-0 transition-transform duration-300 group-open:rotate-45 flex items-center">+</span>
                </summary>
                <p className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-gray-600 text-xs sm:text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section — premium styling, depth and form focus */}
      <section id="contact" className="relative py-16 md:py-28 bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 text-white overflow-hidden contact-section-bg">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" aria-hidden />
        </div>
        <div className="contact-section-pattern absolute inset-0 pointer-events-none z-0" aria-hidden />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-primary scroll-reveal reveal-spring">Get In Touch</h2>
            <span className="inline-block w-12 h-0.5 bg-accent rounded-full mb-4 scroll-reveal text-reveal-fade" style={{ animationDelay: "0.1s" }} aria-hidden />
            <p className="text-accent/95 text-sm sm:text-base scroll-reveal text-reveal-fade" style={{ animationDelay: "0.15s" }}>Questions? We’re here to help.</p>
          </div>

          {/* One big card: left = contact info, right = form */}
          <div className="contact-form-panel bg-white rounded-[30px] border border-gray-200 shadow-xl w-full overflow-hidden mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
              {/* Left half: contact cards stacked */}
              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 bg-gray-50/80 border-b lg:border-b-0 lg:border-r border-gray-200">
                <h3 className="text-primary font-bold text-lg sm:text-xl mb-4 sm:mb-6">Contact us</h3>
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
                      content: "kigalisafetyoshtrainingcenter@gmail.com",
                      link: "mailto:kigalisafetyoshtrainingcenter@gmail.com",
                    },
                  ].map((contact, idx) => {
                    const Icon = contact.icon;
                    const isAddress = contact.content === "Kicukiro, Kigali, Rwanda" && contact.link === "/contact#map";
                    const content = (
                      <>
                        <Icon className="w-8 h-8 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors text-sm sm:text-base">{contact.title}</h4>
                          <p className="text-gray-600 text-sm mt-0.5">
                            {contact.link ? (
                              contact.link.startsWith("http") || contact.link.startsWith("mailto:") ? (
                                <a
                                  href={contact.link}
                                  className="text-primary hover:text-accent underline decoration-dotted underline-offset-2"
                                  {...(contact.link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contact.content}
                                </a>
                              ) : (
                                <span className="text-primary">{contact.content} — View map</span>
                              )
                            ) : (
                              contact.content
                            )}
                          </p>
                        </div>
                      </>
                    );
                    const blockClass = "flex items-start gap-4 p-4 rounded-[20px] hover:bg-white/80 transition-colors group";
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
                <p className="text-primary font-semibold text-sm sm:text-base mb-4">Send us a message</p>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    aria-label="Your Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="contact-input w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-[30px] bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    aria-label="Your Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="contact-input w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-[30px] bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    aria-label="Phone number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="contact-input w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-[30px] bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    aria-label="Your Message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    className="contact-input w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-[30px] bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  {contactError && <p className="text-red-600 text-sm">{contactError}</p>}
                  {contactSuccess && (
                    <p className="text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Message sent. We will get back to you soon.
                    </p>
                  )}
                  <button type="submit" disabled={contactLoading} className="contact-btn-primary w-full bg-gradient-to-r from-accent to-accent/90 text-black font-bold py-3.5 sm:py-4 rounded-[30px] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                    {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/login" className="contact-btn-primary inline-block bg-gradient-to-r from-accent to-accent/90 text-black px-8 sm:px-12 py-3 sm:py-4 rounded-[30px] font-bold text-base sm:text-lg hover:scale-[1.02] active:scale-[0.98] transform scroll-reveal reveal-flip delay-2200">
              ENROLL NOW!
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
