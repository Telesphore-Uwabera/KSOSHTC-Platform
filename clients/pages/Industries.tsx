import { useEffect } from "react";
import { Link } from "react-router-dom";
import { HardHat, Building, Pickaxe, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";

const industries = [
  { icon: HardHat, name: "OSH in Construction", desc: "Height, scaffolding, PPE. Officer, Supervisor, Inspector.", img: "/construction.webp", slug: "construction" },
  { icon: Building, name: "OSH in Industrial", desc: "LOTO, chemical, fire. Officer, HSE Assistant.", img: "/industrial.webp", slug: "industrial-safety" },
  { icon: Pickaxe, name: "OSH in Mining", desc: "Blasting, ventilation. Mining Officer, Supervisor.", img: "/mining.webp", slug: "mining" },
];

const faqs = [
  { q: "Which industry is right for my team?", a: "We serve Construction and infrastructure, Manufacturing and industrial production, and Mining and extraction. If your work spans more than one sector, we can tailor a combined or sector-specific program. Contact us to discuss your needs." },
  { q: "Do you offer sector-specific certificates?", a: "Yes. Our programs are designed to support sector-specific competencies and align with national and industry expectations for Safety Officers, Supervisors, and HSE roles." },
];

export default function Industries() {
  useEffect(() => {
    document.title = "Industries | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="relative text-white py-16 sm:py-20 md:py-28 min-h-[40vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <SiteImage src="/ksohtc-4.webp" alt="" hero priority className="w-full h-full object-cover hero-zoom bg-image-animate bg-image-move-endless" decoding="async" aria-hidden />
          <div className="absolute inset-0 bg-[#121815]/80" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121815] via-transparent to-[#121815]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
            <span className="eyebrow__rule" />
            <span>Target Sectors</span>
          </div>
          <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-bone mb-3">Industries We Serve</h1>
          <p className="text-sm sm:text-base text-stone-300 max-w-xl">Training for Rwanda&apos;s key sectors.</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-[#FCFAF6] border-y border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {industries.map((item, idx) => (
              <Link
                key={idx}
                to={`/courses/${item.slug}`}
                className="editorial-card group block bg-white rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="relative overflow-hidden aspect-[16/10]">
                  <SiteImage
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    decoding="async"
                  />
                  <div className="img-overlay" aria-hidden="true" />
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex w-12 h-12 rounded-xl bg-stone-100 border border-black/[0.06] items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <item.icon className="w-6 h-6" />
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink group-hover:text-primary transition-colors mb-2">{item.name}</h2>
                    <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-black/[0.06] flex items-center justify-between text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                    <span>Explore Specialization</span>
                    <ArrowRight className="w-4 h-4 btn-arrow-icon" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col items-center">
            <div className="eyebrow eyebrow--dark justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Sectors FAQ</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ink mb-8 sm:mb-10 text-center">Industry FAQs</h2>
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
