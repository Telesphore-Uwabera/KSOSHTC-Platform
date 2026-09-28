import { describe, it, expect } from "vitest";
import { getCertificateTypeLabel, type CertificateType } from "./certificateTypeLabels";

describe("certificateTypeLabels", () => {
  it("returns the fire safety and egress label for the new certificate type", () => {
    expect(getCertificateTypeLabel("fire-safety-egress")).toBe("FIRE SAFETY AND EGRESS");
  });

  it("keeps the existing course titles for specialized certificates", () => {
    expect(getCertificateTypeLabel("first-aid" as CertificateType)).toBe("FIRST AID TRAINING");
    expect(getCertificateTypeLabel("lifting-safety" as CertificateType)).toBe("SAFE LIFTING OPERATIONS");
    expect(getCertificateTypeLabel("height-safety" as CertificateType)).toBe("WORKING AT HEIGHT SAFETY");
  });
});
