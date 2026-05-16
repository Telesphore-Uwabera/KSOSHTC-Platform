import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SiteImage } from "@/components/SiteImage";
import { Menu, X, Home, Info, BookOpen, Building2, GraduationCap, Mail, HardHat, Building, Pickaxe, ChevronDown, LayoutDashboard, Shield, UserCog, ClipboardSignature } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getApiBase } from "@/lib/apiBase";

const courseDropdownItems = [
  { label: "Construction", path: "/courses/construction", icon: HardHat },
  { label: "Industrial Safety", path: "/courses/industrial-safety", icon: Building },
  { label: "Mining", path: "/courses/mining", icon: Pickaxe },
] as const;

const navLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "About", path: "/about", icon: Info },
  { label: "Programs", path: "/programs", icon: BookOpen },
  { label: "Industries", path: "/industries", icon: Building2 },
  { label: "Courses", path: "/courses", icon: GraduationCap, isDropdown: true },
  { label: "Contact", path: "/contact", icon: Mail },
];

const SCROLL_THRESHOLD = 40;

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isInstructorRoute = location.pathname.startsWith("/instructor");
  const isCoursesActive = location.pathname === "/courses" || courseDropdownItems.some((c) => location.pathname === c.path);

  const { data: settingsData } = useQuery({
    queryKey: ["public", "settings"],
    queryFn: async () => {
      const res = await fetch(getApiBase() + "/api/settings");
      if (!res.ok) return { isRegistrationActive: false };
      const data = await res.json();
      return data.settings;
    },
  });
  const isRegistrationActive = settingsData?.isRegistrationActive ?? false;

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > SCROLL_THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const compact = scrolled;
  const headerClass =
    "fixed top-0 left-0 right-0 z-50 animate-fade-in-down transition-all duration-300 ease-out bg-white shadow-md backdrop-blur-sm";

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className={`flex items-center gap-1 sm:gap-2 transition-all duration-300 ${compact ? "h-16 sm:h-20 md:h-20" : "h-20 sm:h-24 md:h-28"}`}>
          <div className="hidden md:flex md:flex-1 md:items-center md:min-w-0" />
          <div className="hidden md:flex md:items-center md:justify-center md:flex-shrink-0">
            <div className={`flex items-center gap-2 lg:gap-4 pl-3 pr-3 sm:pl-4 sm:pr-4 transition-all duration-300 ${compact ? "py-1 gap-2" : "py-2 sm:py-3"}`}>
              <Link to="/" className="flex-shrink-0 flex items-center group cursor-pointer transition-all duration-300 hover:scale-105">
                <SiteImage
                  src="/logo.webp"
                  alt="KSOSHTC Logo"
                  width={512}
                  height={512}
                  sizes="(max-width: 768px) 96px, 160px"
                  className={`object-contain max-w-full h-auto transition-all duration-300 group-hover:rotate-3 ${compact ? "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" : "w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32"}`}
                  loading="eager"
                  decoding="async"
                />
              </Link>
              <nav className="flex gap-1 sm:gap-2 lg:gap-3 items-center">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  if (link.isDropdown) {
                    return (
                      <div
                        key={link.path}
                        className="relative group"
                        onMouseEnter={() => setCoursesDropdownOpen(true)}
                        onMouseLeave={() => setCoursesDropdownOpen(false)}
                      >
                        <span className="relative inline-block">
                          <Link
                            to={link.path}
                            className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base ${isCoursesActive ? "text-primary" : "text-gray-700 hover:text-primary"}`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            {link.label}
                            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${coursesDropdownOpen ? "rotate-180" : ""}`} />
                          </Link>
                          <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ${isCoursesActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                        </span>
                        {coursesDropdownOpen && (
                          <div className="absolute top-full left-0 pt-1 min-w-[200px] z-50 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 overflow-hidden">
                              {courseDropdownItems.map((item) => {
                                const ItemIcon = item.icon;
                                return (
                                  <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${location.pathname === item.path ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-primary/10 hover:text-primary"}`}
                                  >
                                    <ItemIcon className="w-4 h-4 shrink-0" />
                                    {item.label}
                                  </Link>
                                );
                              })}
                              <Link
                                to="/courses"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-primary/10 hover:text-primary border-t border-gray-100"
                              >
                                <GraduationCap className="w-4 h-4 shrink-0" />
                                All courses
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 font-medium transition-all duration-300 relative group text-xs sm:text-sm lg:text-base ${location.pathname === link.path ? "text-primary" : "text-gray-700 hover:text-primary"}`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      {link.label}
                      <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ${location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"}`} />
                    </Link>
                  );
                })}
                {isRegistrationActive && (
                  <Link
                    to="/training-registration"
                    className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 font-medium transition-all duration-300 relative group text-xs sm:text-sm lg:text-base ${location.pathname === "/training-registration" ? "text-primary" : "text-gray-700 hover:text-primary"}`}
                  >
                    <ClipboardSignature className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    Registration
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ${location.pathname === "/training-registration" ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </Link>
                )}
<Link
                to={isAdminRoute ? "/admin" : isInstructorRoute ? "/instructor" : "/dashboard"}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base border-2 ${
                    (isAdminRoute
                      ? location.pathname === "/admin"
                      : isInstructorRoute
                        ? location.pathname === "/instructor"
                        : location.pathname === "/dashboard")
                      ? "bg-primary text-white border-primary shadow-md"
                      : "border-primary text-primary bg-primary/10 hover:bg-primary hover:text-white hover:shadow-md"
                  }`}
                >
                  {isAdminRoute ? (
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  ) : isInstructorRoute ? (
                    <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  ) : (
                    <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  )}
                  {isAdminRoute ? "Admin" : isInstructorRoute ? "Instructor" : "Dashboard"}
                </Link>
              </nav>
            </div>
          </div>
          <div className="hidden md:block md:flex-1 md:min-w-0" />

          <Link to="/" className="md:hidden flex-shrink-0 flex items-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <SiteImage
              src="/logo.webp"
              alt="KSOSHTC Logo"
              width={512}
              height={512}
              sizes="96px"
              className={`object-contain max-w-full h-auto transition-all duration-300 group-hover:rotate-3 ${compact ? "w-14 h-14 sm:w-16 sm:h-16" : "w-20 h-20 sm:w-24 sm:h-24"}`}
              loading="eager"
              decoding="async"
            />
          </Link>

          <div className="md:hidden flex-1 min-w-0" aria-hidden />

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center gap-2 py-2 pl-3 pr-3 rounded-lg hover:bg-gray-100 transition-colors duration-300 ml-auto"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? (
              <X className="w-5 h-5 text-primary animate-spin-fast shrink-0" />
            ) : (
              <Menu className="w-5 h-5 text-primary shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-700">{isOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden bg-gradient-to-b from-white to-gray-50 border-t border-gray-200 animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                if (link.isDropdown) {
                  return (
                    <div key={link.path} className="space-y-0.5">
                      <Link
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                          location.pathname === link.path ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {link.label}
                      </Link>
                      <div className="pl-6 pr-2 space-y-0.5">
                        {courseDropdownItems.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                location.pathname === item.path ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-primary/10 hover:text-primary"
                              }`}
                            >
                              <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      location.pathname === link.path ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
              {isRegistrationActive && (
                <Link
                  to="/training-registration"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    location.pathname === "/training-registration" ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <ClipboardSignature className="w-4 h-4 shrink-0" />
                  Registration
                </Link>
              )}
              <Link
                to={isAdminRoute ? "/admin" : "/dashboard"}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 ${
                  (isAdminRoute ? location.pathname === "/admin" : location.pathname === "/dashboard")
                    ? "bg-primary text-white border-primary"
                    : "border-primary text-primary bg-primary/10 hover:bg-primary hover:text-white"
                }`}
              >
                {isAdminRoute ? <Shield className="w-4 h-4 shrink-0" /> : <LayoutDashboard className="w-4 h-4 shrink-0" />}
                {isAdminRoute ? "Admin" : "Dashboard"}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
