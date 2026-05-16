import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteImage } from "@/components/SiteImage";
import { MapPin, Phone, Mail, Code2, ExternalLink, Home, Info, BookOpen, Building2, MessageCircle, Send, Loader2 } from "lucide-react";
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
    <footer className="bg-gray-900 text-gray-300 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 items-start">
          <div className="flex flex-col items-start text-left min-w-0">
            <Link to="/" className="block">
              <SiteImage
                src="/logo.webp"
                alt="KSOSHTC Footer Logo"
                width={512}
                height={512}
                sizes="(max-width: 768px) 128px, 176px"
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 object-contain max-w-full transition-all duration-300 hover:scale-110 mb-4 sm:mb-6"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="text-accent font-semibold text-xs sm:text-sm mb-1 sm:mb-2">Kigali Safety OSH Training Center</p>
            <p className="text-accent font-medium text-xs sm:text-sm">Safety Today, Prosperity Tomorrow!</p>
          </div>

          <div className="text-left min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 uppercase tracking-wider">Contact</h4>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <Link to="/contact#map" className="flex items-center gap-3 whitespace-nowrap hover:text-accent transition-colors duration-300">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="truncate">Kicukiro Center, Kigali, Rwanda</span>
              </Link>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <a href="https://wa.me/250785072512" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-300">
                  +250 785 072 512
                </a>
              </div>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <a
                  href="mailto:ksoshtc@gmail.com"
                  className="hover:text-accent transition-colors duration-300 truncate"
                  title="ksoshtc@gmail.com"
                >
                  ksoshtc@gmail.com
                </a>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 w-full rounded-lg overflow-hidden border border-gray-600 h-14 sm:h-16 md:h-20">
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
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-accent hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Get directions
            </a>
          </div>

          <div className="text-left min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {[
                { to: "/", label: "Home", icon: Home },
                { to: "/about", label: "About Us", icon: Info },
                { to: "/programs", label: "Programs", icon: BookOpen },
                { to: "/industries", label: "Industries", icon: Building2 },
                { to: "/contact", label: "Contact", icon: MessageCircle },
              ].map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-accent transition-colors duration-300 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
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
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50 pr-12"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Subscribe"
                >
                  {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 sm:pt-8 mt-8 sm:mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
              © {new Date().getFullYear()} Kigali Safety OSH Training Center. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-accent transition-colors duration-300">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-accent transition-colors duration-300">Terms &amp; Conditions</Link>
              <Link to="/cookies" className="hover:text-accent transition-colors duration-300">Cookie Policy</Link>
              <a
                href="https://uwaberatelesphore.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-green-500/70 bg-transparent px-2.5 py-1.5 rounded-none hover:bg-green-500/10 hover:text-accent transition-colors duration-300"
              >
                <Code2 className="w-4 h-4" />
                Contact Developer
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
