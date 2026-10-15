import { scriptMongoConnect } from "./lib/mongo-script";
import crypto from "node:crypto";

interface CourseSeed {
  id: string;
  slug: string;
  title: string;
  description: string;
  sector: string;
  duration: string;
  order: number;
  coverImageUrl: string;
  modules: {
    title: string;
    lessons: {
      title: string;
      contentHtml: string;
      youtubeUrl?: string;
    }[];
  }[];
}

const NEW_COURSES: CourseSeed[] = [
  {
    id: "food-safety",
    slug: "food-safety",
    title: "Food Safety",
    description: "HACCP principles, food hygiene, contamination prevention, temperature control, sanitation standards, and regulatory compliance.",
    sector: "Hospitality & Food Processing",
    duration: "3 months",
    order: 4,
    coverImageUrl: "/ksohtc-4.webp",
    modules: [
      {
        title: "Section 1: Fundamentals of Food Hygiene & Microbiology",
        lessons: [
          {
            title: "Introduction to Food Safety & Microbial Contamination",
            contentHtml: "Understanding foodborne illnesses, biological, chemical, physical, and allergen hazards, and personal hygiene best practices.",
          },
          {
            title: "Personal Hygiene & Food Handlers Health Standards",
            contentHtml: "Proper handwashing, protective clothing, reporting illnesses, and maintaining hygienic food preparation environments.",
          },
        ],
      },
      {
        title: "Section 2: HACCP Systems & Temperature Control",
        lessons: [
          {
            title: "The 7 Principles of HACCP",
            contentHtml: "Hazard analysis, critical control points (CCPs), critical limits, monitoring procedures, corrective actions, and verification.",
          },
          {
            title: "Cold Chain, Cooking & Storage Temperatures",
            contentHtml: "Safe food holding, reheating, refrigeration thresholds, danger zone awareness (5°C to 60°C), and cross-contamination prevention.",
          },
        ],
      },
    ],
  },
  {
    id: "safety-management",
    slug: "safety-management",
    title: "Safety Management",
    description: "Occupational health and safety management systems, risk profiling, hazard identification, incident reporting, and ISO 45001 safety frameworks.",
    sector: "General Management",
    duration: "3 months",
    order: 5,
    coverImageUrl: "/ksohtc-1.webp",
    modules: [
      {
        title: "Section 1: OSH Management Systems & ISO 45001",
        lessons: [
          {
            title: "Principles of Modern Occupational Safety Management",
            contentHtml: "Leadership commitment, worker participation, safety policy formulation, and plan-do-check-act (PDCA) cycle.",
          },
          {
            title: "Workplace Hazard Identification & Risk Assessment (HIRA)",
            contentHtml: "Methods for identifying workplace hazards, qualitative/quantitative risk matrices, and implementing hierarchy of controls.",
          },
        ],
      },
      {
        title: "Section 2: Incident Investigation & Safety Auditing",
        lessons: [
          {
            title: "Root Cause Analysis & Incident Investigation",
            contentHtml: "5-Whys methodology, fishbone diagram, evidence collection, corrective action tracking, and statutory reporting.",
          },
          {
            title: "Safety Inspections, Audits & Continuous Improvement",
            contentHtml: "Internal safety audit protocols, performance metrics (LTIR, TRIR), and sustaining an active safety culture.",
          },
        ],
      },
    ],
  },
  {
    id: "safe-lifting-operations",
    slug: "safe-lifting-operations",
    title: "Safe Lifting Operations",
    description: "Rigging, slinging techniques, crane safety, load weight calculations, lifting accessories inspection, hand signals, and site lifting plans.",
    sector: "Logistics & Heavy Operations",
    duration: "3 months",
    order: 6,
    coverImageUrl: "/ksohtc-practical-drill.webp",
    modules: [
      {
        title: "Section 1: Rigging, Slinging & Load Calculation",
        lessons: [
          {
            title: "Lifting Gear & Tackle Inspection (Slings, Shackles, Hooks)",
            contentHtml: "Pre-use checks, safe working load (SWL / WLL), rejection criteria, and certification of lifting equipment.",
          },
          {
            title: "Center of Gravity, Load Estimation & Sling Angles",
            contentHtml: "Calculating load weights, sling tension factors based on angle, and choosing correct rigging configurations.",
          },
        ],
      },
      {
        title: "Section 2: Crane Safety, Signaling & Lifting Plans",
        lessons: [
          {
            title: "Standard Crane Hand Signals & Radio Communications",
            contentHtml: "Banksman and rigger communication protocols, blind lifts, crane exclusion zones, and hazard zoning.",
          },
          {
            title: "Developing and Executing a Critical Lift Plan",
            contentHtml: "Permit-to-work requirements, ground bearing pressure, outrigger pad setup, weather limits, and emergency abort procedures.",
          },
        ],
      },
    ],
  },
  {
    id: "fire-safety-and-egress",
    slug: "fire-safety-and-egress",
    title: "Fire Safety and Egress",
    description: "Fire chemistry, classification of fires, extinguisher handling, emergency evacuation planning, emergency egress routes, and fire risk assessments.",
    sector: "Emergency Response & Facilities",
    duration: "3 months",
    order: 7,
    coverImageUrl: "/ksohtc-7.webp",
    modules: [
      {
        title: "Section 1: Fire Dynamics, Prevention & Extinguishers",
        lessons: [
          {
            title: "The Fire Triangle/Tetrahedron & Classes of Fire (A, B, C, D, K)",
            contentHtml: "Understanding fuel, oxygen, heat, and chemical chain reactions, and fire propagation behavior.",
          },
          {
            title: "Portable Fire Extinguishers & The PASS Technique",
            contentHtml: "Pull, Aim, Squeeze, Sweep. Extinguisher selection (Water, Foam, Dry Powder, CO2, Wet Chemical) and maintenance.",
          },
        ],
      },
      {
        title: "Section 2: Means of Egress & Evacuation Planning",
        lessons: [
          {
            title: "Emergency Egress Routes, Signage & Emergency Lighting",
            contentHtml: "Exit door hardware, travel distances, maintaining unobstructed fire exits, fire-rated assemblies, and illumination requirements.",
          },
          {
            title: "Emergency Response Teams & Fire Drill Coordination",
            contentHtml: "Fire warden responsibilities, roll call procedures, assembly points, and managing people with disabilities during evacuations.",
          },
        ],
      },
    ],
  },
  {
    id: "esg",
    slug: "esg",
    title: "Environmental Social and Governance (ESG)",
    description: "Environmental stewardship, carbon reduction, sustainability governance, social workplace ethics, stakeholder engagement, and ESG reporting standards.",
    sector: "Corporate Governance & Sustainability",
    duration: "3 months",
    order: 8,
    coverImageUrl: "/ksohtc-site-visit.webp",
    modules: [
      {
        title: "Section 1: Foundations of Environmental, Social & Governance",
        lessons: [
          {
            title: "Introduction to ESG & Corporate Sustainability Frameworks",
            contentHtml: "Overview of ESG pillars, global reporting standards (GRI, SASB, TCFD), and integrating sustainability into corporate strategy.",
          },
          {
            title: "Environmental Stewardship & Resource Conservation",
            contentHtml: "Waste management, water stewardship, circular economy principles, and Scope 1, 2, and 3 greenhouse gas emissions.",
          },
        ],
      },
      {
        title: "Section 2: Social Responsibility & Corporate Governance",
        lessons: [
          {
            title: "Social Capital: Worker Rights, Diversity & Community Impact",
            contentHtml: "Human rights due diligence, fair labor standards, occupational health as an ESG metric, and community engagement.",
          },
          {
            title: "Governance: Anti-Corruption, Transparency & ESG Metrics",
            contentHtml: "Board oversight, business ethics, supply chain traceability, data integrity, and ESG audit compliance.",
          },
        ],
      },
    ],
  },
  {
    id: "first-aid",
    slug: "first-aid",
    title: "First Aid",
    description: "Cardiopulmonary resuscitation (CPR), AED deployment, wound dressing, trauma management, fracture stabilization, burns treatment, and basic life support.",
    sector: "Emergency Care & Health",
    duration: "3 months",
    order: 9,
    coverImageUrl: "/ksohtc-8.webp",
    modules: [
      {
        title: "Section 1: Basic Life Support & Emergency Assessment",
        lessons: [
          {
            title: "Primary Assessment & DRSABCD Action Plan",
            contentHtml: "Danger, Response, Send for help, Airway, Breathing, CPR, Defibrillation (AED). Universal precautions and scene safety.",
          },
          {
            title: "CPR Techniques (Adult, Child, Infant) & Choking Relief",
            contentHtml: "High-quality chest compressions, rescue breathing, airway obstruction relief (Heimlich maneuver), and automated external defibrillator (AED) usage.",
          },
        ],
      },
      {
        title: "Section 2: Trauma, Medical Emergencies & Wound Care",
        lessons: [
          {
            title: "Severe Bleeding, Shock & Wound Dressing",
            contentHtml: "Direct pressure, pressure bandages, tourniquet application, managing hypovolemic shock, and infection control.",
          },
          {
            title: "Fractures, Dislocations, Sprains & Burns Management",
            contentHtml: "RICE protocol, splinting, spinal injury stabilization, chemical/thermal burn treatment, and heat-related illness response.",
          },
        ],
      },
    ],
  },
];

async function main() {
  const { client, db } = await scriptMongoConnect();
  console.log("[seed-new-courses] connected to MongoDB");

  const coursesCol = db.collection("courses");
  const modulesCol = db.collection("modules");
  const lessonsCol = db.collection("lessons");

  for (const c of NEW_COURSES) {
    const existing = await coursesCol.findOne({ id: c.id });
    const now = new Date().toISOString();

    const courseDoc = {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      sector: c.sector,
      duration: c.duration,
      order: c.order,
      published: true,
      coverImageUrl: c.coverImageUrl,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    await coursesCol.updateOne(
      { id: c.id },
      { $set: courseDoc },
      { upsert: true }
    );
    console.log(`[seed-new-courses] Upserted course: ${c.title} (${c.id})`);

    // Check if course has modules already
    const existingModules = await modulesCol.find({ courseId: c.id }).toArray();
    if (existingModules.length === 0) {
      for (let mIdx = 0; mIdx < c.modules.length; mIdx++) {
        const m = c.modules[mIdx];
        const moduleId = crypto.randomUUID();
        const moduleDoc = {
          id: moduleId,
          courseId: c.id,
          title: m.title,
          order: mIdx,
          createdAt: now,
          updatedAt: now,
        };
        await modulesCol.insertOne(moduleDoc);

        for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
          const l = m.lessons[lIdx];
          const lessonId = crypto.randomUUID();
          const lessonDoc = {
            id: lessonId,
            courseId: c.id,
            moduleId: moduleId,
            title: l.title,
            contentHtml: l.contentHtml,
            youtubeUrl: l.youtubeUrl || "",
            order: lIdx,
            published: true,
            createdAt: now,
            updatedAt: now,
          };
          await lessonsCol.insertOne(lessonDoc);
        }
      }
      console.log(`[seed-new-courses] Created ${c.modules.length} modules for ${c.title}`);
    }
  }

  console.log("[seed-new-courses] Finished successfully!");
  await client.close();
}

main().catch((err) => {
  console.error("Error seeding courses:", err);
  process.exit(1);
});
