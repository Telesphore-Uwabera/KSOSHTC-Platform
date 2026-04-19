import { useEffect } from "react";
import { HardHat, Building, Pickaxe } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";

const industries = [
  { icon: HardHat, name: "OSH in Construction", desc: "Height, scaffolding, PPE. Officer, Supervisor, Inspector.", img: "/construction.webp" },
  { icon: Building, name: "OSH in Industrial", desc: "LOTO, chemical, fire. Officer, HSE Assistant.", img: "/industrial.webp" },
  { icon: Pickaxe, name: "OSH in Mining", desc: "Blasting, ventilation. Mining Officer, Supervisor.", img: "/mining.webp" },
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
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-secondary/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 hero-reveal-slow" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>Industries We Serve</h1>
          <p className="text-sm sm:text-base text-white/90 max-w-xl hero-reveal-slow" style={{ animationDelay: "0.9s", animationFillMode: "both" }}>Training for Rwanda&apos;s key sectors.</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-[30px] border-2 border-accent/20 bg-white/70 shadow-lg py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {industries.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[30px] overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] scroll-reveal reveal-scale-slow"
                style={{ animationDelay: `${1 + idx * 0.3}s` }}
              >
                <div className="relative">
                  <SiteImage
                    src={item.img}
                    alt={item.name}
                    className="w-full h-48 sm:h-52 object-cover rounded-[30px]"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    decoding="async"
                  />
                  <div className="img-overlay rounded-[30px]" aria-hidden="true" />
                </div>
                <div className="p-6 sm:p-8">
                  <span className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-[30px] bg-primary/10 items-center justify-center text-primary mb-4">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </span>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2">{item.name}</h2>
                  <p className="text-gray-600 text-xs sm:text-sm leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-8 sm:mb-10 text-center scroll-reveal reveal-scale-slow delay-400">Industry FAQs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full max-w-5xl mx-auto">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-[30px] border-2 border-gray-200 overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 scroll-reveal reveal-blur" style={{ animationDelay: `${0.8 + idx * 0.2}s` }}>
                <summary className="flex items-start sm:items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 cursor-pointer list-none font-semibold text-gray-800 hover:text-primary transition-colors min-h-[3.5rem]">
                  <span className="text-left text-sm sm:text-base line-clamp-2 flex-1 pr-2">{faq.q}</span>
                  <span className="text-primary text-xl shrink-0 transition-transform duration-300 group-open:rotate-45 flex items-center">+</span>
                </summary>
                <p className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-100 bg-gray-50/50">{faq.a}</p>
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
