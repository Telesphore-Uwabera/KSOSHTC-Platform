import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Shield, HardHat, Building, Pickaxe, Crown, Star, Award, Sparkles, Building2, UserCheck, AlertTriangle, Users, Globe, Target } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";

export default function About() {
  useEffect(() => {
    document.title = "About Us | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      {/* Shared background for About hero + Who We Are (single image, no duplication) */}
      <div className="relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <SiteImage
            src="/about-emmanuel-2.webp"
            alt=""
            hero
            priority
            className="w-full h-full object-cover hero-zoom bg-image-animate bg-image-move-endless"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/70" aria-hidden="true" />
        </div>

        {/* Page hero */}
        <section className="relative py-16 sm:py-20 md:py-28 min-h-[40vh] flex flex-col justify-center">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 hero-reveal-slow" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>About Us</h1>
            <p className="text-base sm:text-xl text-white/90 max-w-2xl hero-reveal-slow" style={{ animationDelay: "0.9s", animationFillMode: "both" }}>Who we are, our mission, vision, and what our graduates are trained to do.</p>
          </div>
        </section>

        {/* Who We Are */}
        <section className="relative py-16 sm:py-20 md:py-28 min-h-[60vh] flex flex-col justify-center">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-windy">
          <div className="mb-8 sm:mb-10">
            <h2 className="section-header text-white mb-4 scroll-reveal reveal-flip drop-shadow-md">Who We Are</h2>
            <p className="text-white/90 text-sm sm:text-base max-w-2xl scroll-reveal text-reveal-fade drop-shadow" style={{ animationDelay: "0.15s" }}>OSH capacity-building for construction, industrial & mining.</p>
          </div>
          <p className="text-white/95 text-sm sm:text-base mb-8 leading-relaxed max-w-3xl scroll-reveal reveal-spring delay-1200 drop-shadow">
            <span className="font-bold text-white">KSOSHTC</span> — competent safety professionals. Construction, industrial & mining. <span className="font-semibold text-accent">Safety today, Prosperity tomorrow.</span>
          </p>

          {/* Row 1: Three goal cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-10">
            {[
              { title: "Safety Supervision", desc: "Labour-aligned education.", icon: CheckCircle2 },
              { title: "Structured Training", desc: "Practice-oriented culture.", icon: CheckCircle2 },
              { title: "Risk & Incidents", desc: "Fewer accidents, compliance.", icon: Shield },
            ].map((item, idx) => (
              <div key={idx} className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-white/15 transition-all duration-300 group border border-white/20 bg-white/10 backdrop-blur-sm scroll-reveal ${idx === 1 ? "reveal-bounce" : "reveal-spring"}`} style={{ animationDelay: `${1.5 + idx * 0.2}s` }}>
                <item.icon className="w-6 h-6 text-accent flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <p className="font-bold text-white mb-1 group-hover:text-accent transition-colors text-sm sm:text-base">{item.title}</p>
                  <p className="text-white/80 text-xs sm:text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: Three sector cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {[
              { icon: HardHat, label: "OSH in Construction", sub: "Construction & infrastructure", slug: "construction" },
              { icon: Building, label: "OSH in Industrial", sub: "Manufacturing & industrial", slug: "industrial-safety" },
              { icon: Pickaxe, label: "OSH in Mining", sub: "Mining & extraction", slug: "mining" },
            ].map((item, idx) => (
              <Link 
                to={`/courses/${item.slug}`}
                key={idx} 
                className={`bg-white/10 backdrop-blur-sm rounded-[30px] h-48 flex flex-col items-center justify-center shadow-lg border-2 border-white/20 hover:border-accent hover:bg-white/15 transition-all scroll-reveal cursor-pointer group/card ${idx === 0 ? "reveal-flip" : "reveal-rotate-in"}`} 
                style={{ animationDelay: `${2 + idx * 0.25}s` }}
              >
                <item.icon className="w-12 h-12 text-accent mb-3 group-hover/card:scale-110 transition-transform" />
                <p className="font-bold text-white group-hover/card:text-accent transition-colors">{item.label}</p>
                <p className="text-sm text-white/80">{item.sub}</p>
              </Link>
            ))}
          </div>
          </div>
        </section>
      </div>

      {/* Mission & Vision — left/right slow, long delay; rainfall overlay + sway */}
      <section className="relative py-16 md:py-24 bg-white overflow-hidden">
        <div className="rainfall-overlay" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12 scroll-reveal reveal-rotate-in">Our Vision & Mission</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-[30px] shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 scroll-reveal reveal-rotate-in delay-600 animate-sway">
              <div className="bg-gradient-to-r from-secondary to-secondary/80 text-white py-8 px-8">
                <h3 className="section-header text-white">Our Mission</h3>
              </div>
              <div className="relative">
                <SiteImage
                  src="/ksohtc-8.webp"
                  alt="KSOSHTC mission — team on site"
                  className="w-full h-40 object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  decoding="async"
                />
                <div className="img-overlay" aria-hidden="true" />
              </div>
              <div className="p-6 sm:p-8 pt-5 sm:pt-6">
                <p className="text-sm text-gray-700 leading-relaxed font-medium mb-6">
                  To deliver <span className="font-bold text-primary">high-quality, practical OSH training</span> that develops competent professionals, prevents workplace accidents, strengthens compliance, and promotes a proactive safety culture.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Award, title: "High-Quality Training", desc: "Practical, industry-aligned OSH education" },
                    { icon: UserCheck, title: "Competent Professionals", desc: "Develop safety officers, supervisors, inspectors" },
                    { icon: AlertTriangle, title: "Prevent Accidents", desc: "Reduce workplace accidents and hazards" },
                    { icon: Shield, title: "Strengthen Compliance", desc: "Regulatory and international best practices" },
                    { icon: Users, title: "Proactive Safety Culture", desc: "Across construction, industrial and mining sectors" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 group">
                      <item.icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                      <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-gray-600 text-sm mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[30px] shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 scroll-reveal reveal-flip delay-1000">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8 px-8">
                <h3 className="section-header text-white">Our Vision</h3>
              </div>
              <div className="relative">
                <SiteImage
                  src="/ksohtc-9.webp"
                  alt="KSOSHTC vision — training"
                  className="w-full h-40 object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  decoding="async"
                />
                <div className="img-overlay" aria-hidden="true" />
              </div>
              <div className="p-8">
                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  <span className="font-bold text-primary">Long-term contributor</span> to national safety. Capacity building.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Crown, title: "Excellence", desc: "Commitment to highest standards in OSH training and education" },
                    { icon: Star, title: "Accreditation", desc: "Recognized certification and regulatory compliance" },
                    { icon: Star, title: "Industry Impact", desc: "Measurable improvements in workplace safety across Rwanda" },
                    { icon: Target, title: "Quality Assurance", desc: "Continuous improvement of training delivery and outcomes" },
                    { icon: Globe, title: "Regional Leadership", desc: "Setting the standard for OSH education across the region" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <item.icon className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-800">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Our Graduates Are Trained To Do — background image with overlay and text on top */}
      <section className="relative py-16 md:py-24 min-h-[50vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <SiteImage src="/ksohtc-7.webp" alt="" hero className="w-full h-full object-cover bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/70" aria-hidden="true" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <h2 className="section-header text-white mb-2 text-xl sm:text-2xl md:text-3xl scroll-reveal reveal-bounce drop-shadow-md">What Our Graduates Are Trained To Do</h2>
          <p className="text-white/90 text-xs sm:text-sm mb-8 scroll-reveal text-reveal-fade drop-shadow" style={{ animationDelay: "0.2s" }}>Essential safety competencies.</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: "Safety Officer", desc: "On completion." },
              { title: "Safety Supervisor", desc: "Site/Factory." },
              { title: "Safety Inspector", desc: "Inspections, audits." },
              { title: "HSE Assistant", desc: "HSE support." },
              { title: "Safety Manager", desc: "With experience." },
              { title: "Compliance", desc: "Standards & regulations." },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 border border-white/10 transition-all duration-300 scroll-reveal reveal-spring" style={{ animationDelay: `${1.6 + idx * 0.2}s` }}>
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-white/90 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
