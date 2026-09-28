export type CertificateType =
  | "general"
  | "first-aid"
  | "lifting-safety"
  | "height-safety"
  | "fire-safety-egress";

export const getCertificateTypeLabel = (type: CertificateType | undefined): string => {
  switch (type) {
    case "first-aid":
      return "FIRST AID TRAINING";
    case "lifting-safety":
      return "SAFE LIFTING OPERATIONS";
    case "height-safety":
      return "WORKING AT HEIGHT SAFETY";
    case "fire-safety-egress":
      return "FIRE SAFETY AND EGRESS";
    default:
      return "CONSTRUCTION WORKPLACES";
  }
};
