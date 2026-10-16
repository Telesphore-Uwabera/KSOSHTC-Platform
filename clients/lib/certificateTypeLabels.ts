export type CertificateType =
  | "general"
  | "first-aid"
  | "lifting-safety"
  | "height-safety"
  | "fire-safety-egress"
  | "food-safety"
  | "safety-management"
  | "esg"
  | "construction"
  | "industrial-safety"
  | "mining"
  | "iso-45001"
  | "iso-14011";

export const getCertificateTypeLabel = (type: CertificateType | string | undefined, courseTitle?: string): string => {
  if (courseTitle && courseTitle.trim()) {
    return courseTitle.toUpperCase();
  }
  switch (type) {
    case "first-aid":
      return "FIRST AID TRAINING";
    case "lifting-safety":
      return "SAFE LIFTING OPERATIONS";
    case "height-safety":
      return "WORKING AT HEIGHT SAFETY";
    case "fire-safety-egress":
      return "FIRE SAFETY AND EGRESS";
    case "food-safety":
      return "FOOD SAFETY";
    case "safety-management":
      return "SAFETY MANAGEMENT";
    case "esg":
      return "ENVIRONMENTAL SOCIAL AND GOVERNANCE (ESG)";
    case "construction":
      return "CONSTRUCTION WORKPLACES";
    case "industrial-safety":
      return "INDUSTRIAL SAFETY";
    case "mining":
      return "MINING WORKPLACES";
    case "iso-45001":
      return "ISO 45001: OCCUPATIONAL HEALTH AND SAFETY MANAGEMENT SYSTEM (OH&SMS)";
    case "iso-14011":
      return "ISO 14011: ENVIRONMENTAL MANAGEMENT SYSTEM (EMS)";
    default:
      return "CONSTRUCTION WORKPLACES";
  }
};
