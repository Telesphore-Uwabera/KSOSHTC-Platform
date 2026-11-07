import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const DEFAULT_TITLE = "Kigali Safety OSH Training Center - KSOSHTC";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy | KSOSHTC";
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
            <span>DATA GOVERNANCE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-bone tracking-tight mb-4">
            Privacy <span className="font-serif italic text-accent font-normal">Policy</span>
          </h1>
          <p className="text-bone/80 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
            Kigali Safety &amp; OSH Training Centre (KSOSHTC) respects your privacy. This policy
            describes how we collect, use, and protect your personal data when you use our website
            and learning platform.
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
              1. Data we collect
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              We may collect the following information when you register, contact us, or use our
              services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3 font-light">
              <li>Name, email address, and phone number</li>
              <li>Organization and job role (if provided)</li>
              <li>Industry or sector of interest (for course access)</li>
              <li>Account credentials (password, stored for authentication)</li>
              <li>Messages you send via our contact form</li>
              <li>Progress and quiz results on the learning platform</li>
            </ul>
            <p className="font-light leading-relaxed">
              We may also collect technical data such as IP address and browser type for security
              and to improve our services.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              2. How we use your data
            </h2>
            <p className="mb-3 font-light leading-relaxed">We use your data to:</p>
            <ul className="list-disc pl-5 space-y-1.5 font-light">
              <li>Create and manage your learner account and approve access to courses</li>
              <li>Send you notifications about registration status and account approval</li>
              <li>Respond to your contact form inquiries and provide support</li>
              <li>Deliver training content and record your progress and assessments</li>
              <li>Comply with legal or regulatory requirements</li>
              <li>Improve our website, platform, and services</li>
            </ul>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              3. Storage and security
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              Your data is stored on secure servers (including cloud providers such as Firebase).
              We take reasonable measures to protect your personal information from unauthorized
              access, loss, or misuse.
            </p>
            <p className="font-light leading-relaxed">
              No method of transmission over the internet is 100% secure. We encourage you to
              keep your password confidential and to log out when using shared devices.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              4. Sharing your data
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              We do not sell your personal data. We may share your information only:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-light">
              <li>With service providers who help us operate our platform (e.g. hosting, email),
                  under strict confidentiality obligations</li>
              <li>When required by law or to protect our rights, safety, or the safety of others</li>
            </ul>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              5. Your rights
            </h2>
            <p className="font-light leading-relaxed">
              Depending on applicable law, you may have the right to access, correct, or delete your
              personal data, or to withdraw consent. To exercise these rights or to ask questions
              about your data, please contact us using the details on our{" "}
              <Link to="/contact" className="text-primary font-semibold hover:underline">
                Contact page
              </Link>
              .
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              6. Cookies and similar technologies
            </h2>
            <p className="font-light leading-relaxed">
              We use cookies and similar technologies to run the site and remember your preferences.
              For details, see our{" "}
              <Link to="/cookies" className="text-primary font-semibold hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              7. Changes to this policy
            </h2>
            <p className="font-light leading-relaxed">
              We may update this Privacy Policy from time to time. The latest version will be
              posted on this page with an updated “Last updated” date. Continued use of our
              services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              8. Contact
            </h2>
            <p className="font-light leading-relaxed">
              For privacy-related questions or requests, contact us via our{" "}
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
