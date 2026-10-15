/**
 * Real course definitions: Safety Management (shared) + sector-specific materials.
 * Files are served from /courses/<folder>/<encoded filename>.
 */

export const SAFETY_MANAGEMENT_FILES = [
  "Element 1 Notes.pdf",
  "ELEMENT 2 Notes.pdf",
  "ELEMENT 3 Notes.pdf",
  "ELEMENT 4.pdf",
] as const;

const CONSTRUCTION_FILES = [
  "1.1+-+Health,+Safety,+and+the+Construction+Industry.pdf",
  "1.2+-+Importance+of+Health+and+Safety+Management.pdf",
  "1.3+KEY+DEFINITIONS+AND+TERMS.pdf",
  "1.4+Heirarchy+of+Controls.pdf",
  "1.8+-+Critical+Risks.pdf",
  "2.1+SAFETY+MANAGEMENT+PLAN.pdf",
  "2.2+-+Risk+Analysis.pdf",
  "2.3+-+Works+Planning+and+Staging.pdf",
  "2.4+-+Safety+in+Design.pdf",
  "3.1+-+Site+Inductions.pdf",
  "3.2.+-+Training+and+VOC.pdf",
  "3.5+-+Job+Hazard+Analysis.pdf",
  "3.9+-+Health+and+Safety+Statistics.pdf",
  "4.2+-+Cranes+and+Lifting.pdf",
  "5.1+-+Section+1+Review.pdf",
  "Contruction work site.pdf",
  "Cranes and Derrikcs.pdf",
  "Cranes.pdf",
  "Demolitions.pdf",
  "Fall protection in Constr.pdf",
  "Fall Protection Program.pdf",
  "Focus 4 Fall Hazards.pdf",
  "Health Hazards In Constr.pdf",
  "Safe Scafording.pdf",
  "Scafording Safety Pr.pdf",
];

const INDUSTRIAL_SAFETY_FILES = [
  "1-+Safety+By+Design.pdf",
  "2+-+Hazard+Asssement.pdf",
  "3.Hazard+Assessment+and+Control-+A+handbook+for+Alberta+employers+and+workers.pdf",
  "4. PowerPoint+-+Buildings+&+Facility+Layout.pdf",
  "5.-+Safeguarding.pdf",
  "6-+Personal+Protective+Equipment.pdf",
  "7-+Working+at+Height+(Canada+-+Federal).pdf",
  "8+-+Electrical+Safety.pdf",
  "9+-+Confined+Spaces+(Canada+-+Federal).pdf",
  "10+-+Material+Handling+&+Storage.pdf",
  "11-+Hoisting+&+Conveying.pdf",
  "12-+Elevating+Devices.pdf",
  "13-+Ropes+Slings+Chains (1).pdf",
  "14+-+Powered+Industrial+Trucks.pdf",
  "15+-+Vehicles+&+Heavy+Vehicles.pdf",
  "16+-+Hand+&+Portable+Power+Tools.pdf",
  "17+-+Grinders.pdf",
  "18-+Woodworking.pdf",
  "19-+Hot+&+Cold+Metal+Working.pdf",
  "20+-+Metal+Welding+&+Joining.pdf",
  "21+-+Nanomaterials.pdf",
  "22+-+Automated+Systems.pdf",
  "23-+Process+Safety+Management.pdf",
  "Advanced+Certificate+in+Health+Safety+and+Environment+HSE+Level+3 (1) HSE.pdf",
  "Emergency Action Plan.pdf",
  "Excavation.pdf",
  "osha2226.pdf",
  "Scafolding safety.pdf",
];

const MINING_FILES = [
  "2+-+Hazard+Asssement.pdf",
  "3.Hazard+Assessment+and+Control-+A+handbook+for+Alberta+employers+and+workers.pdf",
  "4. PowerPoint+-+Buildings+&+Facility+Layout.pdf",
  "6-+Personal+Protective+Equipment.pdf",
  "7-+Working+at+Height+(Canada+-+Federal).pdf",
  "8+-+Electrical+Safety.pdf",
  "9+-+Confined+Spaces+(Canada+-+Federal).pdf",
  "10+-+Material+Handling+&+Storage.pdf",
  "11-+Hoisting+&+Conveying.pdf",
  "15+-+Vehicles+&+Heavy+Vehicles.pdf",
  "17+-+Grinders.pdf",
  "18-+Woodworking.pdf",
  "19-+Hot+&+Cold+Metal+Working.pdf",
  "20+-+Metal+Welding+&+Joining.pdf",
  "1926 electric_external_1.pptx",
  "Advanced+Certificate+in+Health+Safety+and+Environment+HSE+Level+3 (1) HSE.pdf",
  "AR-Slips,TripsandfallsI.pdf",
  "Contruction work site.pdf",
  "CORESafety-Handbook (1).pdf",
  "Emergency Action Plan.pdf",
  "Excavation.pdf",
  "Fire Prevention Plan.pdf",
  "First Aid For Miners (1).pdf",
  "Health and Safety Module. Final. July 2024.pdf",
  "ILO MINING (1).pdf",
  "Mining-Safety-Handbook_2016 (1).pdf",
  "Nail gun.pdf",
  "osha2226.pdf",
  "Scafolding safety.pdf",
];

export type CourseId =
  | "construction"
  | "industrial-safety"
  | "mining"
  | "food-safety"
  | "safety-management"
  | "safe-lifting-operations"
  | "fire-safety-and-egress"
  | "esg"
  | "first-aid";

export interface CourseDef {
  id: CourseId;
  title: string;
  sector: string;
  desc: string;
  duration: string;
  sectorModuleFiles: readonly string[];
}

export const COURSES: CourseDef[] = [
  {
    id: "construction",
    title: "OSH in Construction",
    sector: "Construction",
    desc: "Site safety, fall prevention, cranes, scaffolding, PPE, and construction-specific risk management. Includes the core Safety Management module.",
    duration: "3 months",
    sectorModuleFiles: CONSTRUCTION_FILES,
  },
  {
    id: "industrial-safety",
    title: "OSH in Industrial Safety",
    sector: "Industrial",
    desc: "Machinery safety, hazard assessment, PPE, working at height, electrical and confined spaces, and emergency response. Includes the core Safety Management module.",
    duration: "3 months",
    sectorModuleFiles: INDUSTRIAL_SAFETY_FILES,
  },
  {
    id: "mining",
    title: "OSH in Mining",
    sector: "Mining",
    desc: "Mining safety handbook, first aid for miners, ILO standards, and sector-specific hazards. Includes the core Safety Management module.",
    duration: "3 months",
    sectorModuleFiles: MINING_FILES,
  },
  {
    id: "food-safety",
    title: "Food Safety",
    sector: "Food & Beverage",
    desc: "HACCP principles, food hygiene, contamination control, safe food handling, storage, sanitation, and regulatory compliance standards.",
    duration: "3 months",
    sectorModuleFiles: [],
  },
  {
    id: "safety-management",
    title: "Safety Management",
    sector: "General Management",
    desc: "Core OSH management systems, ISO 45001 framework, workplace hazard identification, risk assessment, incident investigation, and safety policy planning.",
    duration: "3 months",
    sectorModuleFiles: SAFETY_MANAGEMENT_FILES,
  },
  {
    id: "safe-lifting-operations",
    title: "Safe Lifting Operations",
    sector: "Logistics & Heavy Operations",
    desc: "Crane operations, rigging, slinging, load assessment, hoist maintenance, signaling, lifting plans, and prevention of dropped objects.",
    duration: "3 months",
    sectorModuleFiles: [],
  },
  {
    id: "fire-safety-and-egress",
    title: "Fire Safety and Egress",
    sector: "Emergency Response",
    desc: "Fire risk assessments, fire prevention, emergency egress routing, extinguisher operation, evacuation drills, and building safety compliance.",
    duration: "3 months",
    sectorModuleFiles: [],
  },
  {
    id: "esg",
    title: "Environmental Social and Governance (ESG)",
    sector: "Corporate Governance",
    desc: "Sustainability reporting, environmental risk mitigation, social responsibility, workplace ethics, carbon accounting, and regulatory compliance.",
    duration: "3 months",
    sectorModuleFiles: [],
  },
  {
    id: "first-aid",
    title: "First Aid",
    sector: "Emergency Care",
    desc: "Cardiopulmonary resuscitation (CPR), basic life support, wound care, triage, emergency response protocol, and workplace medical first aid.",
    duration: "3 months",
    sectorModuleFiles: [],
  },
];

/** Base URL for course assets (no trailing slash). */
export const COURSES_BASE = "/courses";

export function courseFileUrl(folder: "safety-management" | CourseId, filename: string): string {
  return `${COURSES_BASE}/${folder}/${encodeURIComponent(filename)}`;
}
