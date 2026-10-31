import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users,
  Eye,
  Footprints,
  FileCheck2,
  ShieldAlert,
  Briefcase,
  BookCheck,
  ListOrdered,
  BadgeCheck,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SiteImage } from "../components/SiteImage";

export default function AdmissionRequirements() {
  useEffect(() => {
    document.title = "Eligibility & Admission Requirements | KSOSHTC";
    window.scrollTo(0, 0);
    return () => {
      document.title = "Kigali Safety OSH Training Center - KSOSHTC";
    };
  }, []);

  const generalRequirements = [
    "Have a genuine interest in Occupational Safety and Health, workplace safety, and accident prevention.",
    "Be willing to participate in classroom lessons and practical training activities.",
    "Be able to complete assignments, examinations, and other learning activities.",
    "Be willing to participate in supervised construction, industrial, or mining site visits where applicable.",
    "Demonstrate discipline, responsibility, and professional conduct.",
    "Follow KSOSHTC training policies, safety instructions, and institutional regulations.",
    "Provide accurate personal and academic information during registration.",
    "Be willing to develop the knowledge and practical competencies required for safe working environments.",
  ];

  const mandatoryPPE = [
    {
      title: "Safety Helmet (Hard Hat)",
      description: "Protects against potential head injuries from falling or moving objects.",
      icon: HardHat,
    },
    {
      title: "Safety Boots",
      description: "Protective-toe safety footwear suitable for construction, mining, and industrial site environments.",
      icon: Footprints,
    },
    {
      title: "High-Visibility Vest or Jacket",
      description: "Improves visibility in areas with active machinery, vehicles, and moving equipment.",
      icon: Eye,
    },
    {
      title: "Safety Gloves",
      description: "Appropriate hand protection depending on the practical task and identified hazards.",
      icon: ShieldCheck,
    },
    {
      title: "Safety Goggles / Protective Glasses",
      description: "Protects eyes against dust, airborne particles, splashes, and optical hazards.",
      icon: ShieldAlert,
    },
  ];

  const additionalPPE = [
    "Hearing protection (earplugs or earmuffs) for high-noise areas.",
    "Respiratory protective equipment (dust masks, particulate respirators).",
    "Protective coveralls or specialized workplace safety clothing.",
    "Full-body safety harness and compatible fall-protection equipment (under competent supervision).",
  ];

  const applicantProfiles = [
    {
      title: "Secondary School Graduates",
      desc: "Recent Advanced Level (A2) graduates seeking an in-demand, practical professional career in safety.",
      icon: GraduationCap,
    },
    {
      title: "Aspiring Safety Officers & HSE Pros",
      desc: "Individuals eager to lead safety management, audits, and compliance across diverse industries.",
      icon: ShieldCheck,
    },
    {
      title: "Industry Employees",
      desc: "Current workers in construction, manufacturing, extraction, and mining seeking accredited safety certification.",
      icon: Briefcase,
    },
    {
      title: "Supervisors, Team Leaders & Techs",
      desc: "Field managers and technicians responsible for operational site oversight and zero-accident policies.",
      icon: Users,
    },
    {
      title: "Workplace Health & Safety Leads",
      desc: "Appointed organizational officers tasked with implementing ISO 45001 and national labour standards.",
      icon: FileCheck2,
    },
    {
      title: "Career Changers & Professionals",
      desc: "Professionals seeking career progression, upskilling, or formal credentials in Occupational Safety and Health.",
      icon: Sparkles,
    },
  ];

  const learnerCommitments = [
    "Attend and actively participate in scheduled training sessions.",
    "Complete assigned coursework, exercises, and assessments in a timely manner.",
    "Participate in practical learning activities and supervised site visits as applicable.",
    "Respect trainers, fellow learners, workplace personnel, and site regulations.",
    "Apply safety principles during all practical exercises and simulations.",
    "Maintain professional discipline, integrity, and ethical conduct throughout the programme.",
  ];

  const admissionSteps = [
    {
      step: "01",
      title: "Complete Online Registration",
      desc: "Fill out the official online KSOSHTC registration form with your preferred course selection.",
    },
    {
      step: "02",
      title: "Provide Personal & Academic Info",
      desc: "Provide accurate personal details, contact information, citizenship, and academic background.",
    },
    {
      step: "03",
      title: "Upload Supporting Documents",
      desc: "Submit your A2 secondary degree/certificate, ID/passport, passport-size photo, and fee payment proof.",
    },
    {
      step: "04",
      title: "Review & Comply with Terms",
      desc: "Acknowledge the admission requirements, PPE guidelines, and code of conduct for practical sessions.",
    },
    {
      step: "05",
      title: "Receive Admission Confirmation",
      desc: "Our admissions committee reviews your submission and issues official enrollment confirmation.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Header />
      <div className="h-24 sm:h-28 md:h-32" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative text-white py-16 sm:py-20 md:py-24 overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary">
        <div className="absolute inset-0">
          <SiteImage
            src="/ksohtc-site-visit.webp"
            alt="KSOSHTC Site Visit and Training"
            hero
            priority
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider border border-accent/30 backdrop-blur-sm">
              <BadgeCheck className="w-4 h-4" />
              Accredited by RTB
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-sm">
              <BookCheck className="w-3.5 h-3.5" />
              Admissions Policy
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 max-w-4xl">
            Eligibility &amp; Admission Requirements
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
            Kigali Safety OSH Training Center (KSOSHTC) welcomes individuals eager to develop professional
            knowledge, practical skills, and recognized competencies in Occupational Safety and Health.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              to="/training-registration"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm sm:text-base bg-accent text-gray-900 hover:bg-accent-light shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <span>Register Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#academic-qualifications"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-semibold text-sm sm:text-base bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all"
            >
              <span>View Requirements</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 1: Introduction */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Section 01
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Welcome to KSOSHTC Admissions
            </h2>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
              <strong>Kigali Safety OSH Training Center (KSOSHTC)</strong> welcomes individuals who are
              committed to cultivating professional knowledge, practical capabilities, and workplace risk
              prevention expertise in Occupational Safety and Health (OSH).
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our training programmes are purposefully designed both for individuals seeking to launch rewarding careers
              in workplace safety and for active professionals seeking to upgrade their competencies across construction,
              mining, and industrial environments.
            </p>
          </div>
        </section>

        {/* Section 2: Minimum Academic Qualification */}
        <section id="academic-qualifications" className="scroll-mt-28">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50/50 rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-sm">
            <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4" />
              Section 02
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Minimum Academic Qualification
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-6">
              To be eligible for admission to KSOSHTC programmes, all applicants must satisfy the following baseline criteria:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Advanced Level (A2) Education
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Have successfully completed <strong>Advanced Level Secondary Education (A2)</strong> or hold an officially recognized equivalent credential.
                  </p>
                </div>
                <span className="mt-4 inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                  Mandatory Prerequisite
                </span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                    <BookCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Communication Literacy
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Be able to read, write, comprehend training documentation, and communicate effectively during classroom and field activities.
                  </p>
                </div>
                <span className="mt-4 inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                  English Literacy
                </span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    OSH &amp; Safety Interest
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Demonstrate a genuine passion for workplace safety, occupational health, accident reduction, and hazard prevention.
                  </p>
                </div>
                <span className="mt-4 inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                  Personal Motivation
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: General Admission Requirements */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
            <ListOrdered className="w-4 h-4" />
            Section 03
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            General Admission Requirements
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl mb-8">
            Prospective learners must meet and uphold the following institutional standards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalRequirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed pt-0.5">
                  {req}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Personal Protective Equipment (PPE) Requirements */}
        <section className="bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 rounded-3xl p-6 sm:p-10 shadow-sm border border-amber-200/80">
          <div className="inline-flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
            <HardHat className="w-4 h-4 text-amber-700" />
            Section 04
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Personal Protective Equipment (PPE) Requirements
          </h2>
          <p className="text-gray-700 text-sm sm:text-base max-w-3xl mb-8 leading-relaxed">
            Since KSOSHTC incorporates hands-on practical learning and supervised industrial/site visits into its training programmes,
            all learners must be able to obtain and wear the required Personal Protective Equipment (PPE).
          </p>

          {/* Mandatory PPE Grid */}
          <div className="mb-10">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Mandatory PPE for Practical Classes &amp; Site Visits
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-5">
              Every learner must have access to the following 5 mandatory safety gear items:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mandatoryPPE.map((ppe, idx) => {
                const Icon = ppe.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-amber-200/70 shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-1.5">{ppe.title}</h4>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed flex-1">
                      {ppe.description}
                    </p>
                    <span className="mt-3 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional PPE */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
            <h4 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Additional PPE (Task-Specific &amp; Regulated)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              {additionalPPE.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important PPE Notice */}
          <div className="bg-amber-100/70 border-l-4 border-amber-600 p-5 sm:p-6 rounded-r-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-bold text-amber-950 uppercase tracking-wide">
                  Important PPE Notice
                </h4>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  Learners are responsible for ensuring they have access to mandatory PPE before participating in practical site visits.
                  All PPE must be suitable, in good condition, correctly fitted, and appropriate for the hazards identified.
                </p>
                <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
                  Learners who do not possess the required PPE will not be permitted to participate in practical sessions or site visits where such protection is necessary.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Who Can Apply? */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" />
            Section 05
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Who Can Apply?
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl mb-8">
            KSOSHTC welcomes diverse applicants from multiple academic and professional backgrounds:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {applicantProfiles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 6: Learner Commitment */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            Section 06
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Learner Commitment &amp; Code of Conduct
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl mb-8">
            By joining KSOSHTC, every learner pledges to uphold institutional values and safety culture:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learnerCommitments.map((commitment, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/40 border border-emerald-100"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-800 text-sm leading-relaxed">{commitment}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Admission Process */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
            <ListOrdered className="w-4 h-4" />
            Section 07
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Step-by-Step Admission Process
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl mb-10">
            Enrolling at KSOSHTC is straightforward. Follow these five consecutive steps to complete your registration:
          </p>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {admissionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="relative p-5 rounded-2xl bg-gray-50 border border-gray-200/80 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary/40 mb-3 block">
                      {step.step}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-600 leading-relaxed">
            <strong>Note:</strong> Meeting the minimum eligibility requirements does not automatically guarantee admission.
            Admission is subject to applicable programme vacancies, cohort capacities, and KSOSHTC's formal verification process.
          </div>
        </section>

        {/* Section 8: Start Your Professional Journey CTA */}
        <section className="relative rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary text-white text-center shadow-xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider border border-accent/30">
              <Sparkles className="w-4 h-4" />
              Safety Today, Prosperity Tomorrow
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Start Your Professional Journey in Occupational Safety and Health
            </h2>

            <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed">
              Are you ready to develop the practical skills, industry knowledge, and accredited credentials
              needed to contribute to safer, zero-accident workplaces across Rwanda and beyond?
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/training-registration"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base bg-accent text-gray-900 hover:bg-accent-light shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <span>REGISTER NOW</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-semibold text-base bg-white/10 text-white hover:bg-white/20 border border-white/25 backdrop-blur-sm transition-all"
              >
                <span>Browse All Courses</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

