import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const DEFAULT_TITLE = "Kigali Safety OSH Training Center - KSOSHTC";

export default function Cookies() {
  useEffect(() => {
    document.title = "Cookie Policy | KSOSHTC";
    return () => { document.title = DEFAULT_TITLE; };
  }, []);
  return (
    <div className="min-h-screen bg-[#FCFAF6] text-ink overflow-x-hidden flex flex-col font-sans antialiased">
      <Header />
      <div className="h-24 sm:h-28 md:h-32" aria-hidden="true" />

      {/* Editorial Obsidian Hero */}
      <section className="bg-[#121815] text-bone py-14 sm:py-20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="eyebrow eyebrow--light mb-3">
            <span className="text-brass">KSOSHTC</span>
            <span className="eyebrow__rule" />
            <span>TRANSPARENCY &amp; TRACKING</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-bone tracking-tight mb-4">
            Cookie <span className="font-serif italic text-accent font-normal">Policy</span>
          </h1>
          <p className="text-bone/80 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
            This Cookie Policy explains how Kigali Safety &amp; OSH Training Centre (KSOSHTC) uses
            cookies and similar technologies on our website and learning platform.
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 font-mono text-xs text-brass-lt uppercase tracking-wider">
            Last updated: March 2025
          </div>
        </div>
      </section>

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-sm sm:text-base text-ink/80">
          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              1. What are cookies?
            </h2>
            <p className="font-light leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They
              help the site remember your preferences, keep you logged in, and understand how the
              site is used so we can improve it.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              2. Cookies we use
            </h2>
            <p className="mb-3 font-light leading-relaxed">We use the following types of cookies:</p>
            <ul className="list-disc pl-5 space-y-2 font-light">
              <li>
                <strong className="font-medium text-ink">Strictly necessary:</strong> Required for the site to work (e.g. keeping
                you logged in, security). These cannot be switched off.
              </li>
              <li>
                <strong className="font-medium text-ink">Functional:</strong> Remember your choices (e.g. language, display
                preferences) to give you a better experience.
              </li>
              <li>
                <strong className="font-medium text-ink">Analytics / performance:</strong> Help us see how visitors use the site
                (e.g. pages visited, errors) so we can improve it. We may use first-party or
                third-party tools for this.
              </li>
            </ul>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              3. How long do cookies last?
            </h2>
            <p className="font-light leading-relaxed">
              Session cookies are deleted when you close your browser. Persistent cookies remain
              for a set period (e.g. until expiry or until you clear them) so we can recognize you
              on future visits.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              4. Managing cookies
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              You can control or delete cookies through your browser settings. Most browsers let
              you block or delete cookies; note that blocking all cookies may affect how the site
              works (for example, you may not stay logged in).
            </p>
            <p className="font-light leading-relaxed">
              For more on how we use your data, see our{" "}
              <Link to="/privacy" className="text-primary font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              5. Changes to this policy
            </h2>
            <p className="font-light leading-relaxed">
              We may update this Cookie Policy from time to time. The latest version will be
              posted on this page with an updated “Last updated” date.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              6. Contact
            </h2>
            <p className="font-light leading-relaxed">
              If you have questions about our use of cookies, please contact us via our{" "}
              <Link to="/contact" className="text-primary font-semibold hover:underline">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
