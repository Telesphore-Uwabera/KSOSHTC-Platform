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

const ISO_COURSES: CourseSeed[] = [
  {
    id: "iso-45001",
    slug: "iso-45001",
    title: "ISO 45001: Occupational Health and Safety Management System (OH&SMS)",
    description: "Master the international standard for occupational health and safety. Learn hazard identification, risk assessment, worker participation, operational controls, and audit compliance to ISO 45001:2018 standards.",
    sector: "Quality & Safety Management",
    duration: "3 months",
    order: 10,
    coverImageUrl: "/ksohtc-8.webp",
    modules: [
      {
        title: "Section 1: Framework & Context of the Organization (Clauses 4 & 5)",
        lessons: [
          {
            title: "Overview of ISO 45001:2018 & High-Level Structure (Annex SL)",
            contentHtml: "Understanding the evolution from OHSAS 18001 to ISO 45001, PDCA cycle, organizational context, and identifying internal/external issues and interested parties.",
          },
          {
            title: "Leadership, Worker Participation & Safety Policy",
            contentHtml: "Top management responsibilities, establishing the OH&S policy, organizational roles, and formal mechanisms for worker consultation and active participation.",
          },
        ],
      },
      {
        title: "Section 2: Planning & Risk Assessment (Clause 6)",
        lessons: [
          {
            title: "Hazard Identification & Assessment of OH&S Risks",
            contentHtml: "Systematic hazard identification techniques, assessment of risks and opportunities, determining legal obligations, and setting measurable OH&S objectives.",
          },
          {
            title: "Legal Requirements & Compliance Obligations",
            contentHtml: "Applicable Rwandan labour safety laws, ILO conventions, regulatory registers, and determining how legal compliance is monitored and maintained.",
          },
        ],
      },
      {
        title: "Section 3: Operational Planning, Controls & Emergency Response (Clauses 7 & 8)",
        lessons: [
          {
            title: "Hierarchy of Controls & Operational Control Implementation",
            contentHtml: "Applying elimination, substitution, engineering controls, administrative measures, and PPE; managing change and procurement controls.",
          },
          {
            title: "Emergency Preparedness, Response & Drills",
            contentHtml: "Identifying potential emergency scenarios, establishing emergency protocols, conducting drills, and reviewing response effectiveness post-incident.",
          },
        ],
      },
      {
        title: "Section 4: Performance Evaluation & Internal Audits (Clauses 9 & 10)",
        lessons: [
          {
            title: "Monitoring, Measurement, Analysis & Internal Audit",
            contentHtml: "Key safety KPIs, evaluation of compliance, audit program planning, evidence gathering, non-conformity documentation, and management review meetings.",
          },
          {
            title: "Incident Investigation, Corrective Action & Continual Improvement",
            contentHtml: "Root cause analysis methodologies (5 Whys, Fishbone), corrective action implementation, verification of effectiveness, and driving a proactive safety culture.",
          },
        ],
      },
    ],
  },
  {
    id: "iso-14011",
    slug: "iso-14011",
    title: "ISO 14011: Environmental Management System (EMS)",
    description: "Comprehensive qualification in Environmental Management Systems and auditing procedures. Covers environmental aspect/impact evaluation, pollution control, waste management, compliance obligations, and internal auditing.",
    sector: "Environmental & Sustainability",
    duration: "3 months",
    order: 11,
    coverImageUrl: "/ksohtc-1.webp",
    modules: [
      {
        title: "Section 1: Fundamentals of EMS & Environmental Auditing Principles",
        lessons: [
          {
            title: "Introduction to Environmental Management & ISO Standards",
            contentHtml: "Core concepts of Environmental Management Systems, life-cycle perspective, environmental policy, and principles of environmental auditing.",
          },
          {
            title: "Audit Objectives, Scope & Auditor Responsibilities",
            contentHtml: "Defining audit criteria, roles of lead auditors, competence requirements, confidentiality, and professional ethics in environmental auditing.",
          },
        ],
      },
      {
        title: "Section 2: Environmental Aspects, Impacts & Legal Compliance",
        lessons: [
          {
            title: "Identifying Environmental Aspects & Evaluating Significance",
            contentHtml: "Techniques for assessing emissions to air, releases to water, land contamination, use of raw materials, and natural resource depletion.",
          },
          {
            title: "Environmental Regulations, Permitting & Compliance Management",
            contentHtml: "National environmental standards (REMA), international conventions, compliance tracking registers, and evaluation of compliance procedures.",
          },
        ],
      },
      {
        title: "Section 3: Operational Controls, Waste & Pollution Prevention",
        lessons: [
          {
            title: "Waste Hierarchy, Hazardous Waste Handling & Effluent Control",
            contentHtml: "Practical operational controls for solid and liquid waste, hazardous chemical management, spill response kits, and containment measures.",
          },
          {
            title: "Resource Efficiency, Energy Management & Carbon Footprint",
            contentHtml: "Water conservation, energy efficiency practices, carbon reduction strategies, and promoting circular economy principles in industry.",
          },
        ],
      },
      {
        title: "Section 4: Audit Execution, Reporting & Continual Improvement",
        lessons: [
          {
            title: "Conducting the Environmental Audit & Gathering Objective Evidence",
            contentHtml: "Opening meetings, site inspections, interviewing staff, sampling documentation, identifying non-conformities, and closing meeting protocols.",
          },
          {
            title: "Audit Reporting, Corrective Action & EMS Performance Review",
            contentHtml: "Preparing comprehensive audit reports, evaluating root causes of environmental findings, verifying corrective actions, and continual improvement.",
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("[seed-iso-courses] Connecting to MongoDB...");
  const { db, client } = await scriptMongoConnect();

  const coursesCol = db.collection("courses");
  const modulesCol = db.collection("modules");
  const lessonsCol = db.collection("lessons");

  const now = new Date().toISOString();

  for (const c of ISO_COURSES) {
    console.log(`[seed-iso-courses] Processing course: ${c.title} (${c.id})`);

    const existingCourse = await coursesCol.findOne({ id: c.id });
    if (!existingCourse) {
      await coursesCol.insertOne({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        sector: c.sector,
        duration: c.duration,
        published: true,
        order: c.order,
        coverImageUrl: c.coverImageUrl,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`[seed-iso-courses] Inserted course ${c.id}`);
    } else {
      await coursesCol.updateOne(
        { id: c.id },
        {
          $set: {
            title: c.title,
            description: c.description,
            sector: c.sector,
            duration: c.duration,
            published: true,
            order: c.order,
            coverImageUrl: c.coverImageUrl,
            updatedAt: now,
          },
        }
      );
      console.log(`[seed-iso-courses] Updated existing course ${c.id}`);
    }

    const existingModules = await modulesCol.find({ courseId: c.id }).toArray();
    if (existingModules.length === 0) {
      for (let mIdx = 0; mIdx < c.modules.length; mIdx++) {
        const m = c.modules[mIdx];
        const moduleId = crypto.randomUUID();
        const moduleDoc = {
          id: moduleId,
          courseId: c.id,
          title: m.title,
          description: "",
          order: mIdx,
          published: true,
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
      console.log(`[seed-iso-courses] Created ${c.modules.length} modules for ${c.title}`);
    } else {
      console.log(`[seed-iso-courses] Modules already exist for ${c.id}, skipping module insertion`);
    }
  }

  console.log("[seed-iso-courses] Finished successfully!");
  await client.close();
}

main().catch((err) => {
  console.error("Error seeding ISO courses:", err);
  process.exit(1);
});
