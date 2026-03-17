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
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Header />
      <div className="h-24 sm:h-28 md:h-32" aria-hidden="true" />

      <main className="flex-1">
        <section className="py-10 sm:py-14 bg-gray-50 border-y border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              This Cookie Policy explains how Kigali Safety & OSH Training Centre (KSOSHTC) uses
              cookies and similar technologies on our website and learning platform.
            </p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Last updated: March 2025
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm sm:text-base text-gray-700">
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                1. What are cookies?
              </h2>
              <p>
                Cookies are small text files stored on your device when you visit a website. They
                help the site remember your preferences, keep you logged in, and understand how the
                site is used so we can improve it.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                2. Cookies we use
              </h2>
              <p className="mb-2">We use the following types of cookies:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Strictly necessary:</strong> Required for the site to work (e.g. keeping
                  you logged in, security). These cannot be switched off.
                </li>
                <li>
                  <strong>Functional:</strong> Remember your choices (e.g. language, display
                  preferences) to give you a better experience.
                </li>
                <li>
                  <strong>Analytics / performance:</strong> Help us see how visitors use the site
                  (e.g. pages visited, errors) so we can improve it. We may use first-party or
                  third-party tools for this.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                3. How long do cookies last?
              </h2>
              <p>
                Session cookies are deleted when you close your browser. Persistent cookies remain
                for a set period (e.g. until expiry or until you clear them) so we can recognize you
                on future visits.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                4. Managing cookies
              </h2>
              <p className="mb-2">
                You can control or delete cookies through your browser settings. Most browsers let
                you block or delete cookies; note that blocking all cookies may affect how the site
                works (for example, you may not stay logged in).
              </p>
              <p>
                For more on how we use your data, see our{" "}
                <Link to="/privacy" className="text-primary font-semibold hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                5. Changes to this policy
              </h2>
              <p>
                We may update this Cookie Policy from time to time. The latest version will be
                posted on this page with an updated “Last updated” date.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                6. Contact
              </h2>
              <p>
                If you have questions about our use of cookies, please contact us via our{" "}
                <Link to="/contact" className="text-primary font-semibold hover:underline">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
