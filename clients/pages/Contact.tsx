import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getApiBase } from "@/lib/apiBase";

const MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d4729.875635675041!2d30.103122774967193!3d-1.9845040979975614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMcKwNTknMDQuMiJTIDMwwrAwNicyMC41IkU!5e1!3m2!1sen!2srw!4v1772737124478!5m2!1sen!2srw";
const MAP_DIRECTIONS_URL = "https://www.google.com/maps/dir//-1.984504,30.103123";

const contacts = [
  { icon: MapPin, title: "Address", content: "Kicukiro, Kigali, Rwanda", link: "#map" },
  { icon: Phone, title: "WhatsApp", content: "+250 785 072 512", link: "https://wa.me/250785072512" },
  { icon: Mail, title: "Email", content: "ksoshtc@gmail.com", link: "mailto:ksoshtc@gmail.com" },
];

const faqs = [
  { q: "What are your opening hours?", a: "We are available by WhatsApp during business hours. For visits, please contact us in advance to confirm availability at Kicukiro." },
  { q: "How quickly do you respond to inquiries?", a: "We aim to respond to contact form submissions and emails within 1–2 business days. For urgent enrollment or quote requests, WhatsApp is fastest." },
  { q: "Can I request a quote for group training?", a: "Yes. Use the form below or email us with your organization name, number of participants, and preferred program or sector. We will send a tailored quote." },
  { q: "Where is KSOSHTC located?", a: "We are based at Kicukiro, Kigali, Rwanda. Use the map below for directions or WhatsApp to schedule a visit." },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Contact | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setError("Please fill in name, email, phone, and message.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiBase() + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to send message. Please try again.");
        return;
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
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

      <section className="relative text-white py-16 sm:py-20 md:py-28 min-h-[40vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#121815]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="eyebrow eyebrow--light mb-3 sm:mb-4">
            <span className="eyebrow__rule" />
            <span>Connect With Us</span>
          </div>
          <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-bone mb-3">Get In Touch</h1>
          <p className="text-sm sm:text-base text-stone-300 max-w-xl">Questions or enrollment—we’re here to help.</p>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-24 bg-[#FCFAF6] border-y border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-16">
            {contacts.map((item, idx) => {
              const Icon = item.icon;
              const isAddress = item.content === "Kicukiro, Kigali, Rwanda" && item.link === "#map";
              const cardClass = "editorial-card bg-white rounded-2xl p-6 sm:p-8 text-center";
              const cardContent = (
                <>
                  <span className="inline-flex w-12 h-12 rounded-xl bg-stone-100 border border-black/[0.06] items-center justify-center text-primary mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </span>
                  <h3 className="font-display font-semibold text-base sm:text-lg text-ink mb-1.5">{item.title}</h3>
                  <p className="text-stone-600 whitespace-pre-line text-xs sm:text-sm">
                    {item.link ? (
                      item.link.startsWith("http") || item.link.startsWith("mailto:") ? (
                        <a
                          href={item.link}
                          className="text-primary hover:text-brass underline decoration-dotted transition-colors"
                          {...(item.link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {item.content}
                        </a>
                      ) : (
                        <span className="text-primary">{item.content} — View map</span>
                      )
                    ) : (
                      item.content
                    )}
                  </p>
                </>
              );
              return (
                <div key={idx}>
                  {isAddress ? (
                    <a href="#map" className={`block ${cardClass}`}>
                      {cardContent}
                    </a>
                  ) : (
                    <div className={cardClass}>
                      {cardContent}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm p-6 sm:p-8 md:p-10 mb-12 sm:mb-16">
            <div className="eyebrow eyebrow--dark mb-2">
              <span className="eyebrow__rule" />
              <span>Direct Message</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-6">Send a message</h2>
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border border-black/[0.12] bg-[#FCFAF6] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border border-black/[0.12] bg-[#FCFAF6] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border border-black/[0.12] bg-[#FCFAF6] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
              />
              <textarea
                placeholder="Your Message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border border-black/[0.12] bg-[#FCFAF6] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm resize-none"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && (
                <p className="text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Message sent. We will get back to you soon.
                </p>
              )}
              <div className="flex justify-center w-full pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brass text-ink hover:bg-brass-lt font-display font-semibold uppercase tracking-wider text-xs sm:text-sm py-3.5 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send Message
                </button>
              </div>
            </form>
          </div>

          <div className="w-full flex flex-col items-center">
            <div className="eyebrow eyebrow--dark justify-center mb-3 sm:mb-4">
              <span className="eyebrow__rule" />
              <span>Inquiries</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-6 text-center">Contact FAQs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-5xl mx-auto">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group bg-white rounded-xl border border-black/[0.08] overflow-hidden shadow-xs hover:border-black/20 transition-all duration-300">
                  <summary className="flex items-start sm:items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-display font-medium text-stone-900 hover:text-primary transition-colors min-h-[3.75rem]">
                    <span className="text-left text-xs sm:text-sm md:text-base line-clamp-2 flex-1 pr-2">{faq.q}</span>
                    <span className="text-primary font-mono text-xl shrink-0 transition-transform duration-300 group-open:rotate-45 flex items-center justify-center w-6 h-6 rounded-full bg-black/[0.04]">+</span>
                  </summary>
                  <p className="px-6 pb-6 pt-1 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-black/[0.06] bg-[#FCFAF6]/60">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div id="map" className="mt-12 sm:mt-16 w-full">
            <div className="eyebrow eyebrow--dark mb-2">
              <span className="eyebrow__rule" />
              <span>Physical Presence</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-2">Find us</h2>
            <p className="text-stone-600 text-sm sm:text-base mb-4">
              <a href="#map" className="text-primary hover:text-brass underline decoration-dotted">Kicukiro, Kigali, Rwanda</a>
            </p>
            <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-black/[0.08] bg-stone-100 aspect-video">
              <iframe
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "140px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="KSOSHTC location on Google Maps"
                className="w-full h-full min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
              />
            </div>
            <a
              href={MAP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full font-display font-semibold uppercase tracking-wider text-xs bg-primary text-white hover:bg-ink shadow-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Get directions on Google Maps</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
