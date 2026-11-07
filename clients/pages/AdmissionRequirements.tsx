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
    <div className="min-h-screen bg-[#FCFAF6] flex flex-col font-sans text-ink antialiased selection:bg-accent selection:text-ink">
      <Header />
      <div className="h-24 sm:h-28 md:h-32" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative text-white py-16 sm:py-24 md:py-28 overflow-hidden bg-[#121815]">
        <div className="absolute inset-0">
          <SiteImage
            src="/ksohtc-site-visit.webp"
            alt="KSOSHTC Site Visit and Training"
            hero
            priority
            className="w-full h-full object-cover opacity-25 mix-blend-luminosity filter contrast-125"
            decoding="async"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121815] via-[#121815]/70 to-[#121815]/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="eyebrow eyebrow--light">
              <span className="text-brass">KSOSHTC</span> // ADMISSION POLICY
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 font-mono text-[11px] uppercase tracking-wider backdrop-blur-sm border border-white/10">
              <BadgeCheck className="w-3.5 h-3.5 text-accent" />
              Accredited by RTB
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 max-w-4xl text-bone leading-[1.08]">
            Eligibility &amp; <span className="font-semibold text-accent italic font-serif">Admission</span> Requirements
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-bone/80 max-w-3xl leading-relaxed font-light">
            Kigali Safety OSH Training Center (KSOSHTC) welcomes individuals eager to develop professional
            knowledge, practical skills, and recognized competencies in Occupational Safety and Health.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <Link
              to="/training-registration"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-semibold text-sm bg-accent text-[#121815] hover:bg-accent-light shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Register Now</span>
              <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <a
              href="#academic-qualifications"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm bg-white/10 text-bone hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all"
            >
              <span>View Requirements</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* Section 1: Introduction */}
        <section className="editorial-card p-8 sm:p-12">
          <div className="max-w-4xl">
            <div className="eyebrow eyebrow--dark mb-4">
              <span>SECTION 01</span>
              <span className="eyebrow__rule" />
              <span className="text-brass">INSTITUTIONAL WELCOME</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-6 tracking-tight">
              Welcome to KSOSHTC Admissions
            </h2>
            <p className="text-ink/80 text-base sm:text-lg leading-relaxed mb-5 font-light">
              <strong className="text-ink font-semibold">Kigali Safety OSH Training Center (KSOSHTC)</strong> welcomes individuals who are
              committed to cultivating professional knowledge, practical capabilities, and workplace risk
              prevention expertise in Occupational Safety and Health (OSH).
            </p>
            <p className="text-ink/70 text-base leading-relaxed font-light">
              Our training programmes are purposefully designed both for individuals seeking to launch rewarding careers
              in workplace safety and for active professionals seeking to upgrade their competencies across construction,
              mining, and industrial environments.
            </p>
          </div>
        </section>

        {/* Section 2: Minimum Academic Qualification */}
        <section id="academic-qualifications" className="scroll-mt-28">
          <div className="p-8 sm:p-12 rounded-[28px] bg-paper border border-black/[0.08] shadow-xs">
            <div className="eyebrow eyebrow--dark mb-4">
              <span>SECTION 02</span>
              <span className="eyebrow__rule" />
              <span className="text-brass">BASELINE CRITERIA</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
              Minimum Academic Qualification
            </h2>
            <p className="text-ink/70 text-base mb-8 max-w-3xl font-light">
              To be eligible for admission to KSOSHTC programmes, all applicants must satisfy the following baseline criteria:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="editorial-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-ink mb-3">
                    Advanced Level (A2) Education
                  </h3>
                  <p className="text-ink/70 text-sm leading-relaxed font-light">
                    Have successfully completed <strong className="text-ink font-semibold">Advanced Level Secondary Education (A2)</strong> or hold an officially recognized equivalent credential.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-black/[0.06]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-brass font-semibold">
                    [ Mandatory Prerequisite ]
                  </span>
                </div>
              </div>

              <div className="editorial-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <BookCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-ink mb-3">
                    Communication Literacy
                  </h3>
                  <p className="text-ink/70 text-sm leading-relaxed font-light">
                    Be able to read, write, comprehend training documentation, and communicate effectively during classroom and field activities.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-black/[0.06]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-brass font-semibold">
                    [ Language &amp; Literacy ]
                  </span>
                </div>
              </div>

              <div className="editorial-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-ink mb-3">
                    OSH &amp; Safety Interest
                  </h3>
                  <p className="text-ink/70 text-sm leading-relaxed font-light">
                    Demonstrate a genuine passion for workplace safety, occupational health, accident reduction, and hazard prevention.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-black/[0.06]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-brass font-semibold">
                    [ Professional Motivation ]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: General Admission Requirements */}
        <section className="editorial-card p-8 sm:p-12">
          <div className="eyebrow eyebrow--dark mb-4">
            <span>SECTION 03</span>
            <span className="eyebrow__rule" />
            <span className="text-brass">INSTITUTIONAL STANDARDS</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
            General Admission Requirements
          </h2>
          <p className="text-ink/70 text-base max-w-3xl mb-10 font-light">
            Prospective learners must meet and uphold the following institutional standards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {generalRequirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl border border-black/[0.06] bg-bone hover:border-black/20 hover:bg-paper transition-all duration-300"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ink text-bone font-mono text-xs font-semibold flex items-center justify-center">
                  0{idx + 1}
                </span>
                <p className="text-ink/80 text-sm sm:text-base leading-relaxed pt-1 font-light">
                  {req}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Personal Protective Equipment (PPE) Requirements */}
        <section className="p-8 sm:p-12 rounded-[28px] bg-[#121815] text-bone border border-white/10 shadow-xl">
          <div className="eyebrow eyebrow--light mb-4">
            <span className="text-accent">SECTION 04</span>
            <span className="eyebrow__rule" />
            <span className="text-brass-lt">MANDATORY GEAR</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-light text-bone mb-4 tracking-tight">
            Personal Protective Equipment <span className="font-serif italic text-accent font-normal">(PPE)</span> Requirements
          </h2>
          <p className="text-bone/80 text-base max-w-3xl mb-10 leading-relaxed font-light">
            Since KSOSHTC incorporates hands-on practical learning and supervised industrial/site visits into its training programmes,
            all learners must be able to obtain and wear the required Personal Protective Equipment (PPE).
          </p>

          {/* Mandatory PPE Grid */}
          <div className="mb-10">
            <h3 className="font-mono text-xs uppercase tracking-widest text-brass-lt mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent" />
              MANDATORY PPE FOR PRACTICAL CLASSES &amp; SITE VISITS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mandatoryPPE.map((ppe, idx) => {
                const Icon = ppe.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-accent/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-display font-medium text-bone text-lg mb-2">{ppe.title}</h4>
                      <p className="text-bone/70 text-xs sm:text-sm leading-relaxed font-light">
                        {ppe.description}
                      </p>
                    </div>
                    <span className="mt-5 font-mono text-[10px] text-accent uppercase tracking-widest">
                      // Mandatory item
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional PPE */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 mb-8">
            <h4 className="font-display text-lg text-bone mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Additional PPE (Task-Specific &amp; Regulated)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-bone/80 font-light">
              {additionalPPE.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important PPE Notice */}
          <div className="border border-accent/30 bg-accent/10 p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
                  Important PPE Notice
                </h4>
                <p className="text-xs sm:text-sm text-bone/90 leading-relaxed font-light">
                  Learners are responsible for ensuring they have access to mandatory PPE before participating in practical site visits.
                  All PPE must be suitable, in good condition, correctly fitted, and appropriate for the hazards identified.
                </p>
                <p className="text-xs sm:text-sm font-medium text-bone leading-relaxed">
                  Learners who do not possess the required PPE will not be permitted to participate in practical sessions or site visits where such protection is necessary.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Who Can Apply? */}
        <section className="editorial-card p-8 sm:p-12">
          <div className="eyebrow eyebrow--dark mb-4">
            <span>SECTION 05</span>
            <span className="eyebrow__rule" />
            <span className="text-brass">TARGET PARTICIPANTS</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
            Who Can Apply?
          </h2>
          <p className="text-ink/70 text-base max-w-3xl mb-10 font-light">
            KSOSHTC welcomes diverse applicants from multiple academic and professional backgrounds:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applicantProfiles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl border border-black/[0.08] bg-bone hover:border-black/25 hover:bg-paper hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-ink text-bone flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-display text-lg font-medium text-ink mb-2">
                    {item.title}
                  </h3>
                  <p className="text-ink/70 text-xs sm:text-sm leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 6: Learner Commitment */}
        <section className="editorial-card p-8 sm:p-12">
          <div className="eyebrow eyebrow--dark mb-4">
            <span>SECTION 06</span>
            <span className="eyebrow__rule" />
            <span className="text-brass">ETHICAL PLEDGE</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
            Learner Commitment &amp; Code of Conduct
          </h2>
          <p className="text-ink/70 text-base max-w-3xl mb-10 font-light">
            By joining KSOSHTC, every learner pledges to uphold institutional values and safety culture:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learnerCommitments.map((commitment, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-5 rounded-2xl bg-bone border border-black/[0.06]"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-ink/80 text-sm leading-relaxed font-light">{commitment}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Admission Process */}
        <section className="p-8 sm:p-12 rounded-[28px] bg-paper border border-black/[0.08] shadow-xs">
          <div className="eyebrow eyebrow--dark mb-4">
            <span>SECTION 07</span>
            <span className="eyebrow__rule" />
            <span className="text-brass">ENROLLMENT PIPELINE</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
            Step-by-Step Admission Process
          </h2>
          <p className="text-ink/70 text-base max-w-3xl mb-10 font-light">
            Enrolling at KSOSHTC is straightforward. Follow these five consecutive steps to complete your registration:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {admissionSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-bone border border-black/[0.06] hover:border-black/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-brass block mb-3 font-semibold">
                    STEP {step.step}
                  </span>
                  <h3 className="font-display font-medium text-ink text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-ink/70 text-xs leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-bone rounded-2xl border border-black/[0.06] font-mono text-xs text-ink/70 leading-relaxed">
            <strong className="text-ink">NOTE:</strong> Meeting the minimum eligibility requirements does not automatically guarantee admission.
            Admission is subject to applicable programme vacancies, cohort capacities, and KSOSHTC&apos;s formal verification process.
          </div>
        </section>

        {/* Section 8: Start Your Professional Journey CTA */}
        <section className="relative rounded-[32px] p-10 sm:p-16 md:p-20 overflow-hidden bg-[#121815] text-bone text-center border border-white/10 shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-accent font-mono text-xs uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              SAFETY TODAY, PROSPERITY TOMORROW
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-bone leading-tight">
              Start Your Professional Journey in <span className="font-serif italic text-accent font-normal">Occupational Safety</span>
            </h2>

            <p className="text-bone/80 text-sm sm:text-base md:text-lg leading-relaxed font-light">
              Are you ready to develop the practical skills, industry knowledge, and accredited credentials
              needed to contribute to safer, zero-accident workplaces across Rwanda and beyond?
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/training-registration"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold text-sm bg-accent text-[#121815] hover:bg-accent-light shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>REGISTER NOW</span>
                <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full font-medium text-sm bg-white/10 text-bone hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all"
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
