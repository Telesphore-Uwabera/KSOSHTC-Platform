import React, { useEffect, useState, useRef } from "react";
import { Users, ChevronLeft, ChevronRight, Linkedin, Mail, ShieldCheck } from "lucide-react";
import type { TeamMember } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";

const FALLBACK_TEAM: TeamMember[] = [
  {
    id: "team-1",
    name: "Emmanuel NIYOBUHUNGIRO",
    role: "Managing Director & HSE Specialist",
    bio: "Over 4 years of experience in Occupational Health, Safety, Emergency, and Disaster Management. Lead accredited trainer.",
    avatarUrl: "/about-emmanuel-2.webp",
    order: 1,
    active: true,
    email: "info@ksoshtc.org",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team-2",
    name: "Jacques Roger NIYONTEZE",
    role: "HSSE Professional & Lead Auditor",
    bio: "Over 7 years of experience in energy, infrastructure, mining and industrial safety. Specialist in risk assessment and ISO 45001.",
    avatarUrl: "/ksohtc-8.webp",
    order: 2,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "team-3",
    name: "Marie Claire UWINGABIRE",
    role: "Head of Training & Curriculum",
    bio: "Expert in occupational safety pedagogies, TVET regulatory compliance, and practical workplace safety implementations.",
    avatarUrl: "/ksohtc-7.webp",
    order: 3,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "team-4",
    name: "Aimable MUGISHA",
    role: "Industrial & Mining Safety Lead",
    bio: "Specialist in industrial ergonomics, hazardous materials management, and heavy industry compliance.",
    avatarUrl: "/ksohtc-9.webp",
    order: 4,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export default function TeamSlider() {
  const [team, setTeam] = useState<TeamMember[]>(FALLBACK_TEAM);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${getApiBase()}/api/team`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeam(data);
        }
      })
      .catch(() => {
        // Keep fallback team if API error
      });
  }, []);

  // Duplicate items 3 times for completely seamless continuous loop regardless of screen width
  const loopItems = [...team, ...team, ...team];

  const scrollManual = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 320;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" /> Qualified Leadership &amp; Faculty
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Meet Our Expert Team
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl">
              Accredited health, safety, and environmental professionals dedicated to developing competent safety leaders across industries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollManual("left")}
              className="p-3 rounded-2xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-700 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollManual("right")}
              className="p-3 rounded-2xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-700 transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTINUOUS SLIDING TRACK */}
      <div
        className="relative w-full overflow-hidden pause-marquee group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left & Right gradient edge fades for smooth blend */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

        <div
          ref={containerRef}
          className="flex animate-marquee-left py-4 px-2"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
            animationDuration: `${Math.max(25, team.length * 8)}s`,
          }}
        >
          {loopItems.map((member, idx) => (
            <div
              key={`${member.id}-${idx}`}
              className="w-[280px] sm:w-[320px] shrink-0 mx-3.5 bg-white rounded-[28px] border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden group/card transform hover:-translate-y-1.5"
            >
              {/* Photo Area */}
              <div className="relative h-64 w-full overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
                <img
                  src={member.avatarUrl || "/logo_transparent.webp"}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo_transparent.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Floating Role Badge */}
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-primary shadow-sm tracking-wide line-clamp-1">
                    {member.role}
                  </span>
                </div>
              </div>

              {/* Details Area */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg leading-tight group-hover/card:text-primary transition-colors">
                    {member.name}
                  </h3>

                  {member.bio && (
                    <p className="mt-2.5 text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}
                </div>

                {/* Social / Contact Links */}
                {(member.email || member.linkedinUrl) && (
                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-1.5 text-gray-600 hover:text-primary transition truncate max-w-[200px]"
                        title={member.email}
                      >
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    ) : <span />}

                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-primary/10 text-gray-600 hover:text-primary transition shrink-0"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
