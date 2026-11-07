import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const DEFAULT_TITLE = "Kigali Safety OSH Training Center - KSOSHTC";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms & Conditions | KSOSHTC";
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
            <span>LEGAL AGREEMENT</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-bone tracking-tight mb-4">
            Terms &amp; <span className="font-serif italic text-accent font-normal">Conditions</span>
          </h1>
          <p className="text-bone/80 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
            These Terms and Conditions govern your use of the Kigali Safety &amp; OSH Training Centre
            (KSOSHTC) website and online learning platform. By registering, logging in, or using
            our services, you agree to these terms.
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
              1. Registration and account approval
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              Learner accounts are created through the registration form. Access to courses and
              learning materials is only granted after your registration has been reviewed and
              approved by a KSOSHTC administrator.
            </p>
            <p className="font-light leading-relaxed">
              KSOSHTC may decline or revoke access if the information provided is inaccurate,
              incomplete, or used in a way that is inconsistent with our training objectives or
              applicable regulations.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              2. Use of learning materials
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              All course content, including PDFs, videos, quizzes, and other materials, is
              provided for your personal learning and professional development only.
            </p>
            <p className="font-light leading-relaxed">
              You may not copy, redistribute, resell, or publicly share the materials without
              written permission from KSOSHTC.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              3. Responsibilities of learners
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 font-light">
              <li>Provide accurate information during registration.</li>
              <li>Keep your login details confidential.</li>
              <li>Use the platform respectfully and for training purposes only.</li>
              <li>Follow any additional class rules or safety guidelines communicated by KSOSHTC.</li>
            </ul>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              4. Data and communication
            </h2>
            <p className="mb-3 font-light leading-relaxed">
              We use your contact details to communicate about your registration status, course
              access, assessments, and important updates regarding your training.
            </p>
            <p className="font-light leading-relaxed">
              For more information about how we handle your data, or to request changes, please
              contact us using the details provided on the Contact page.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              5. Changes to these terms
            </h2>
            <p className="font-light leading-relaxed">
              KSOSHTC may update these Terms and Conditions from time to time to reflect changes
              in our services or legal requirements. The latest version will always be available
              on this page. Continued use of the platform after changes are published constitutes
              your acceptance of the updated terms.
            </p>
          </section>

          <section className="editorial-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-ink mb-3">
              6. Contact
            </h2>
            <p className="font-light leading-relaxed">
              If you have any questions about these Terms and Conditions, please reach out via
              our{" "}
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
