import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Shield, HardHat, Building, Pickaxe, Crown, Star, Award, Sparkles, Building2, UserCheck, AlertTriangle, Users, Globe, Target, Utensils, ShieldCheck, Anchor, Flame, Leaf, HeartPulse, FileCheck } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";
import TeamSlider from "../components/TeamSlider";

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
            <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>About Our Institution</span>
            </div>
            <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-bone mb-4">About Us</h1>
            <p className="text-base sm:text-xl text-stone-200 max-w-2xl leading-relaxed">Who we are, our mission, vision, and what our graduates are trained to do.</p>
          </div>
        </section>

        {/* Who We Are */}
        <section className="relative py-16 sm:py-20 md:py-28 min-h-[60vh] flex flex-col justify-center">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="mb-10 sm:mb-12">
              <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
                <span className="eyebrow__rule" />
                <span>Accreditation &amp; Profile</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone mb-2">Who We Are</h2>
              <p className="text-stone-300 text-sm sm:text-base max-w-2xl leading-relaxed">
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

            <p className="text-stone-300 text-sm sm:text-base mb-10 leading-relaxed max-w-3xl">
              <span className="font-bold text-bone">KSOSHTC</span> — competent safety professionals. Construction, industrial &amp; mining. <span className="font-semibold text-brass">Safety today, Prosperity tomorrow.</span>
            </p>

            {/* Row 1: Three goal cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 w-full mb-10">
              {[
                { title: "Safety Supervision", desc: "Labour-aligned education.", icon: CheckCircle2 },
                { title: "Structured Training", desc: "Practice-oriented culture.", icon: CheckCircle2 },
                { title: "Risk & Incidents", desc: "Fewer accidents, compliance.", icon: Shield },
              ].map((item, idx) => (
                <div key={idx} className="editorial-dark-card flex flex-col sm:flex-row gap-4 p-6 group">
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

            {/* Row 2: Sector cards for all 11 courses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
              {[
                { icon: HardHat, label: "OSH in Construction", sub: "Construction & infrastructure", slug: "construction" },
                { icon: Building, label: "OSH in Industrial", sub: "Manufacturing & industrial", slug: "industrial-safety" },
                { icon: Pickaxe, label: "OSH in Mining", sub: "Mining & extraction", slug: "mining" },
                { icon: Utensils, label: "Food Safety", sub: "Hygiene & food handling", slug: "food-safety" },
                { icon: ShieldCheck, label: "Safety Management", sub: "HSE leadership & compliance", slug: "safety-management" },
                { icon: Anchor, label: "Safe Lifting Operations", sub: "Rigging & crane safety", slug: "safe-lifting-operations" },
                { icon: Flame, label: "Fire Safety and Egress", sub: "Prevention & evacuation", slug: "fire-safety-and-egress" },
                { icon: Leaf, label: "ESG Principles", sub: "Governance & sustainability", slug: "esg" },
                { icon: HeartPulse, label: "First Aid & CPR", sub: "Emergency casualty care", slug: "first-aid" },
                { icon: FileCheck, label: "ISO 45001 (OH&SMS)", sub: "Occupational Health & Safety", slug: "iso-45001" },
                { icon: Globe, label: "ISO 14011 (EMS)", sub: "Environmental Management", slug: "iso-14011" },
              ].map((item, idx) => (
                <Link 
                  to={`/courses/${item.slug}`}
                  key={idx} 
                  className="editorial-dark-card block min-h-[10rem] flex flex-col items-center justify-center p-6 text-center group cursor-pointer" 
                >
                  <item.icon className="w-9 h-9 text-brass mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto" />
                  <p className="font-display font-semibold text-bone text-base sm:text-lg leading-tight group-hover:text-brass-lt transition-colors">{item.label}</p>
                  <p className="text-xs text-stone-400 mt-1.5">{item.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Mission & Vision */}
      <section className="relative py-16 md:py-24 bg-[#F7F5F0] overflow-hidden border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-12 sm:mb-16">
            <div className="eyebrow eyebrow--dark mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Institutional Commitment</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-ink">Our Vision &amp; Mission</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 sm:gap-10">
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="bg-[#121815] text-bone py-5 px-6 sm:px-8 flex items-center justify-between border-b border-white/10">
                <span className="eyebrow eyebrow--light text-brass-lt"><span className="eyebrow__rule" /> Purpose</span>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-bone">Our Mission</h3>
              </div>
              <div className="relative">
                <SiteImage
                  src="/ksohtc-8.webp"
                  alt="KSOSHTC mission — team on site"
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
                  {[
                    { icon: Award, title: "High-Quality Training", desc: "Practical, industry-aligned OSH education" },
                    { icon: UserCheck, title: "Competent Professionals", desc: "Develop safety officers, supervisors, inspectors" },
                    { icon: AlertTriangle, title: "Prevent Accidents", desc: "Reduce workplace accidents and hazards" },
                    { icon: Shield, title: "Strengthen Compliance", desc: "Regulatory and international best practices" },
                    { icon: Users, title: "Proactive Safety Culture", desc: "Across construction, industrial and mining sectors" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 group/item">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-ink text-sm sm:text-base">{item.title}</h4>
                        <p className="text-stone-600 text-xs sm:text-sm mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="bg-[#121815] text-bone py-5 px-6 sm:px-8 flex items-center justify-between border-b border-white/10">
                <span className="eyebrow eyebrow--light text-brass-lt"><span className="eyebrow__rule" /> Horizon</span>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-bone">Our Vision</h3>
              </div>
              <div className="relative">
                <SiteImage
                  src="/ksohtc-9.webp"
                  alt="KSOSHTC vision — training"
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
                  {[
                    { icon: Crown, title: "Excellence", desc: "Commitment to highest standards in OSH training and education" },
                    { icon: Star, title: "Accreditation", desc: "Recognized certification and regulatory compliance" },
                    { icon: Star, title: "Industry Impact", desc: "Measurable improvements in workplace safety across Rwanda" },
                    { icon: Target, title: "Quality Assurance", desc: "Continuous improvement of training delivery and outcomes" },
                    { icon: Globe, title: "Regional Leadership", desc: "Setting the standard for OSH education across the region" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 group/item">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 border border-black/[0.06] flex items-center justify-center text-primary flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-ink text-sm sm:text-base">{item.title}</h4>
                        <p className="text-stone-600 text-xs sm:text-sm mt-0.5">{item.desc}</p>
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
      <section className="relative py-16 md:py-24 min-h-[50vh] flex flex-col justify-center overflow-hidden text-bone">
        <div className="absolute inset-0">
          <SiteImage src="/ksohtc-7.webp" alt="" hero className="w-full h-full object-cover bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-[#121815]/80 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" aria-hidden="true" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-8 sm:mb-10">
            <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Career Outcomes</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone mb-2">What Our Graduates Are Trained To Do</h2>
            <p className="text-stone-300 text-xs sm:text-sm md:text-base">Essential safety competencies.</p>
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
              <div key={idx} className="editorial-dark-card flex gap-4 p-6 group">
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

      {/* Leadership & Faculty Team — Continuous Sliding Track */}
      <TeamSlider />

      <Footer />
    </div>
  );
}
