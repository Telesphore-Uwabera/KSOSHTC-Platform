import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Page Not Found | KSOSHTC";
    return () => { document.title = "Kigali Safety OSH Training Center - KSOSHTC"; };
  }, []);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Header />
      <div className="h-24 sm:h-28 md:h-32" aria-hidden="true" />
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="text-center reveal-up max-w-md">
          <h1 className="text-6xl sm:text-7xl font-bold mb-4 text-primary">404</h1>
          <p className="text-xl text-gray-600 mb-6">Oops! This page could not be found.</p>
          <Link to="/" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105">
            Return to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
