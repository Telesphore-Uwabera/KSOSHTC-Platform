import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Lightbulb, Rocket, CheckCircle2, ShieldCheck, HardHat, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";

const programs = [
  { icon: BookOpen, title: "Format", desc: "3 months Intensive or Weekend (2 months). Theory + practice.", color: "from-primary/10 to-accent/10", border: "border-primary" },
  { icon: GraduationCap, title: "Competency-Based", desc: "Risk assessment, case studies. Ready on completion.", color: "from-secondary/10 to-accent/10", border: "border-secondary" },
  { icon: Lightbulb, title: "Careers", desc: "Officer, Supervisor, Inspector, HSE. Experience: Manager.", color: "from-accent/10 to-primary/10", border: "border-accent" },
  { icon: Rocket, title: "Services", desc: "Refresher, Consultancy. Lower risk.", color: "from-secondary/10 to-primary/10", border: "border-secondary" },
];

const faqs = [
  { q: "What courses do you offer?", a: "Occupational Safety & Health in Construction Management (OSH in Construction), OSH in Industrial Sector, and OSH in Mining. Each program has defined key competency areas and prepares graduates for Safety Officer, Supervisor, and related roles." },
  { q: "How long are the programs?", a: "3 Months Intensive Training, or Weekend Option: Friday Afternoon & Sunday (2 Months). Contact us for details on specific programs." },
  { q: "Do you offer in-company training?", a: "Yes. We can deliver tailored training at your organization's premises for groups. Request a quote via the Contact page." },
  { q: "Are programs aligned with national regulations?", a: "Yes. Our training is aligned with Rwanda Labour Regulations and international OSH best practices to support certification and compliance." },
];

export default function Programs() {
  useEffect(() => {
    document.title = "Programs | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="relative text-white py-16 sm:py-20 md:py-28 min-h-[40vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <SiteImage src="/ksohtc-3.webp" alt="" hero priority className="w-full h-full object-cover hero-zoom bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-[#121815]/80" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
            <span className="eyebrow__rule" />
            <span>Curriculum &amp; Formats</span>
          </div>
          <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-bone mb-3">Our Programs</h1>
          <p className="text-sm sm:text-base text-stone-300 max-w-xl">Structured OSH. 3 months Intensive or Weekend (2 months).</p>
        </div>
      </section>

      {/* What We Provide: image as full-width background, 4 cards overlaying */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 min-h-[60vh] flex flex-col justify-center overflow-hidden text-bone">
        <div className="absolute inset-0">
          <SiteImage
            src="/ksohtc-3.webp"
            alt=""
            hero
            className="w-full h-full object-cover bg-image-animate bg-image-move-endless"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-[#121815]/75 backdrop-blur-[2px]" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" aria-hidden />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-8 sm:mb-10">
            <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Training Methodology</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-bone mb-1 sm:mb-2">What We Provide</h2>
            <p className="text-stone-300 text-sm sm:text-base">Practical OSH for competent professionals.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {programs.map((item, idx) => (
              <div
                key={idx}
                className="editorial-dark-card p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-brass mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-semibold text-bone mb-2 group-hover:text-brass-lt transition-colors">{item.title}</h3>
                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission & Eligibility Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#FCFAF6] border-y border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 border border-black/[0.08] shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="eyebrow eyebrow--dark">
                  <span className="eyebrow__rule" />
                  <span>Admission Guidelines</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ink leading-tight">
                  Eligibility &amp; Admission Requirements
                </h2>
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                  Admissions to KSOSHTC programmes require <strong>Advanced Level Secondary Education (A2)</strong> or equivalent,
                  literacy in communication, compliance with institutional regulations, and mandatory <strong>Personal Protective Equipment (PPE)</strong> for supervised practical site visits.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-stone-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>A2 Secondary Education Minimum</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-brass shrink-0" />
                    <span>Mandatory PPE for Practical Site Visits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span>Accredited RTB Training Standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <span>5-Step Verified Admission Process</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0">
                <Link
                  to="/admissions"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-display font-semibold uppercase tracking-wider text-xs sm:text-sm bg-primary text-white hover:bg-ink shadow-sm hover:shadow transition-all text-center group"
                >
                  <span>View Admission Policy</span>
                  <ArrowRight className="w-4 h-4 btn-arrow-icon" />
                </Link>
                <Link
                  to="/training-registration"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-display font-semibold uppercase tracking-wider text-xs sm:text-sm bg-brass text-ink hover:bg-brass-lt shadow-sm hover:shadow transition-all text-center"
                >
                  <span>Register for Training</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col items-center">
            <div className="eyebrow eyebrow--dark justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Guidance</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ink mb-8 sm:mb-10 text-center">Program FAQs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-5xl mx-auto">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group bg-[#FCFAF6] rounded-xl border border-black/[0.08] overflow-hidden shadow-xs hover:border-black/20 transition-all duration-300">
                  <summary className="flex items-start sm:items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-display font-medium text-stone-900 hover:text-primary transition-colors min-h-[3.75rem]">
                    <span className="text-left text-sm sm:text-base leading-snug flex-1 pr-2">{faq.q}</span>
                    <span className="text-primary font-mono text-xl shrink-0 transition-transform duration-300 group-open:rotate-45 flex items-center justify-center w-6 h-6 rounded-full bg-black/[0.04]">+</span>
                  </summary>
                  <p className="px-6 pb-6 pt-1 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-black/[0.06] bg-white/60">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
