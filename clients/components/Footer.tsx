import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteImage } from "@/components/SiteImage";
import { MapPin, Phone, Mail, Code2, ExternalLink, Home, Info, BookOpen, Building2, MessageCircle, Send, Loader2, GraduationCap } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";
import { toast } from "sonner";

const FOOTER_MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d4729.875635675041!2d30.103122774967193!3d-1.9845040979975614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMcKwNTknMDQuMiJTIDMwwrAwNicyMC41IkU!5e1!3m2!1sen!2srw!4v1772737124478!5m2!1sen!2srw";
const MAP_DIRECTIONS_URL = "https://www.google.com/maps/dir//-1.984504,30.103123";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribing(true);
    try {
      const res = await fetch(getApiBase() + "/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }
      toast.success("Successfully subscribed to newsletter!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="relative bg-white text-gray-900 py-12 sm:py-16 lg:py-20 border-t border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 items-start">
          <div className="flex flex-col items-start text-left min-w-0">
            <Link to="/" className="block bg-transparent">
              <SiteImage
                src="/logo_transparent.webp"
                alt="KSOSHTC Footer Logo"
                width={1024}
                height={331}
                sizes="(max-width: 768px) 240px, 320px"
                className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-auto object-contain bg-transparent max-w-full transition-all duration-300 hover:scale-105 mb-4 sm:mb-6"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="text-brass font-semibold text-xs sm:text-sm mb-1 tracking-wide font-display">
              Kigali Safety OSH Training Center
            </p>
            <p className="text-gray-900 font-medium text-xs sm:text-sm">
              Safety Today, Prosperity Tomorrow!
            </p>
          </div>

          <div className="text-left min-w-0">
            <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-mono text-brass font-bold mb-4 sm:mb-6">
              <span className="w-4 h-[1px] bg-brass inline-block" />
              Contact
            </h4>
            <div className="space-y-2.5 sm:space-y-3.5 text-xs sm:text-sm text-gray-900">
              <Link to="/contact#map" className="flex items-center gap-3 whitespace-nowrap hover:text-brass transition-colors duration-300">
                <MapPin className="w-4 h-4 text-brass flex-shrink-0" />
                <span className="truncate text-gray-900">Kicukiro Center, Kigali, Rwanda</span>
              </Link>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Phone className="w-4 h-4 text-brass flex-shrink-0" />
                <a href="https://wa.me/250785072512" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-brass transition-colors duration-300">
                  +250 785 072 512
                </a>
              </div>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Mail className="w-4 h-4 text-brass flex-shrink-0" />
                <a
                  href="mailto:ksoshtc@gmail.com"
                  className="text-gray-900 hover:text-brass transition-colors duration-300 truncate"
                  title="ksoshtc@gmail.com"
                >
                  ksoshtc@gmail.com
                </a>
              </div>
            </div>
            <div className="mt-4 w-full rounded-xl overflow-hidden border border-gray-200 h-16 sm:h-20 shadow-inner">
              <iframe
                src={FOOTER_MAP_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="KSOSHTC location"
                className="w-full h-full min-h-[64px]"
              />
            </div>
            <a
              href={MAP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 text-xs text-brass font-medium hover:underline"
            >
              <ExternalLink className="w-3 h-3 text-brass" />
              Get directions
            </a>
          </div>

          <div className="text-left min-w-0">
            <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-mono text-brass font-bold mb-4 sm:mb-6">
              <span className="w-4 h-[1px] bg-brass inline-block" />
              Quick Links
            </h4>
            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-gray-900">
              {[
                { to: "/", label: "Home", icon: Home },
                { to: "/about", label: "About Us", icon: Info },
                { to: "/programs", label: "Programs", icon: BookOpen },
                { to: "/admissions", label: "Admission Requirements", icon: GraduationCap },
                { to: "/industries", label: "Industries", icon: Building2 },
                { to: "/contact", label: "Contact", icon: MessageCircle },
              ].map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-900 hover:text-brass transition-colors duration-300 flex items-center gap-2.5 group">
                    <Icon className="w-4 h-4 text-brass flex-shrink-0" />
                    <span className="text-gray-900 group-hover:text-brass transition-colors">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left min-w-0">
            <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-mono text-brass font-bold mb-4 sm:mb-6">
              <span className="w-4 h-[1px] bg-brass inline-block" />
              Newsletter
            </h4>
            <p className="text-xs sm:text-sm text-gray-900 mb-4 leading-relaxed font-light">
              Subscribe to our newsletter to receive updates on safety training, programs, and industry news.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  disabled={subscribing}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-full px-5 py-3 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition-all disabled:opacity-50 pr-12"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-accent hover:bg-brass text-[#121815] rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 shadow-xs"
                  aria-label="Subscribe"
                >
                  {subscribing ? <Loader2 className="w-4 h-4 animate-spin text-[#121815]" /> : <Send className="w-4 h-4 text-[#121815]" />}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 sm:pt-8 mt-10 sm:mt-14">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-xs text-gray-900 text-center sm:text-left font-mono">
              © {new Date().getFullYear()} Kigali Safety OSH Training Center. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs text-gray-900">
              <Link to="/privacy" className="text-gray-900 hover:text-brass transition-colors duration-300">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-900 hover:text-brass transition-colors duration-300">Terms &amp; Conditions</Link>
              <Link to="/cookies" className="text-gray-900 hover:text-brass transition-colors duration-300">Cookie Policy</Link>
              <a
                href="https://uwaberatelesphore.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-900 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 px-3.5 py-1.5 rounded-full transition-colors duration-300"
              >
                <Code2 className="w-3.5 h-3.5 text-brass" />
                <span className="text-gray-900">Contact Developer</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block absolute right-8 -bottom-6 font-display font-black text-[96px] text-black/[0.03] select-none pointer-events-none tracking-tight">
        KSOSHTC
      </div>
    </footer>
  );
}
