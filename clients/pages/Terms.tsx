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
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Header />
      <div className="h-24 sm:h-28 md:h-32" aria-hidden="true" />

      <main className="flex-1">
        <section className="py-10 sm:py-14 bg-gray-50 border-y border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">
              Terms and Conditions
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              These Terms and Conditions govern your use of the Kigali Safety & OSH Training Centre
              (KSOSHTC) website and online learning platform. By registering, logging in, or using
              our services, you agree to these terms.
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
                1. Registration and account approval
              </h2>
              <p className="mb-2">
                Learner accounts are created through the registration form. Access to courses and
                learning materials is only granted after your registration has been reviewed and
                approved by a KSOSHTC administrator.
              </p>
              <p>
                KSOSHTC may decline or revoke access if the information provided is inaccurate,
                incomplete, or used in a way that is inconsistent with our training objectives or
                applicable regulations.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                2. Use of learning materials
              </h2>
              <p className="mb-2">
                All course content, including PDFs, videos, quizzes, and other materials, is
                provided for your personal learning and professional development only.
              </p>
              <p>
                You may not copy, redistribute, resell, or publicly share the materials without
                written permission from KSOSHTC.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                3. Responsibilities of learners
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate information during registration.</li>
                <li>Keep your login details confidential.</li>
                <li>Use the platform respectfully and for training purposes only.</li>
                <li>Follow any additional class rules or safety guidelines communicated by KSOSHTC.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                4. Data and communication
              </h2>
              <p className="mb-2">
                We use your contact details to communicate about your registration status, course
                access, assessments, and important updates regarding your training.
              </p>
              <p>
                For more information about how we handle your data, or to request changes, please
                contact us using the details provided on the Contact page.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                5. Changes to these terms
              </h2>
              <p>
                KSOSHTC may update these Terms and Conditions from time to time to reflect changes
                in our services or legal requirements. The latest version will always be available
                on this page. Continued use of the platform after changes are published constitutes
                your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                6. Contact
              </h2>
              <p>
                If you have any questions about these Terms and Conditions, please reach out via
                our{" "}
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

