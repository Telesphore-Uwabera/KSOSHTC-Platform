import React from "react";
import type { Quotation } from "@shared/api";

interface QuotationPreviewProps {
  quotation: Quotation;
  containerRef?: React.RefObject<HTMLDivElement>;
}

/** Formats numbers with spaces as thousand separators (e.g. 200000 -> "200 000") */
function formatAmount(val: number | string): string {
  const num = Number(val);
  if (isNaN(num)) return String(val || "0");
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({ quotation, containerRef }) => {
  const {
    date,
    quotationNo,
    clientName,
    location,
    numberOfParticipants,
    costPerPerson,
    totalCost,
    duration,
    paymentInfo,
    modules,
    trainingMethodology,
    includedInFee,
    paymentTerms,
    additionalInfo,
    trainers,
    preparedBy,
    motto,
  } = quotation;

  return (
    <div className="w-full overflow-x-auto bg-gray-200/70 p-3 sm:p-6 flex justify-center">
      {/* Exact A4 Document Dimensions & Canvas */}
      <div
        ref={containerRef}
        id="quotation-pdf-canvas"
        className="w-[794px] min-h-[1123px] h-auto bg-white text-gray-900 shadow-2xl p-7 font-sans relative flex flex-col justify-between select-none border border-gray-400"
        style={{
          boxSizing: "border-box",
          fontSize: "11px",
          lineHeight: "1.3",
        }}
      >
        <div>
          {/* Header section with Logo & Quotation Box */}
          <div className="flex items-start justify-between mb-3 border-b-2 border-[#0d522c] pb-2">
            <div className="flex items-center gap-2">
              <img
                src="/logo_transparent.webp"
                alt="KSOSHTC Logo"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            {/* Date & Quotation No Box */}
            <div className="border border-[#1b365d] rounded-md p-2 min-w-[250px] bg-gray-50/70 shadow-sm">
              <div className="flex justify-between items-center text-[10.5px] mb-1">
                <span className="font-bold text-gray-700 uppercase tracking-tight">DATE:</span>
                <span className="font-semibold text-gray-900">{date || "24/06/2026"}</span>
              </div>
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="font-bold text-gray-700 uppercase tracking-tight">QUOTATION NO:</span>
                <span className="font-semibold text-gray-900">{quotationNo || "KSOSHTC/0426/FA-AWR"}</span>
              </div>
            </div>
          </div>

          {/* QUOTATION Title Header (Always single row) */}
          <div className="mb-3 border-b-[3px] border-[#0d522c] pb-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#1b365d] tracking-tight uppercase whitespace-nowrap leading-normal">
              QUOTATION OF {clientName ? clientName.toUpperCase() : "CLIENT"}
            </h1>
          </div>

          {/* Top Info Section (Client, Location, Participants, Duration & Payment Info) */}
          <div className="grid grid-cols-12 gap-2.5 mb-3 items-stretch">
            {/* Left 7 columns: Client info */}
            <div className="col-span-7 border border-gray-300 rounded-md p-2.5 flex flex-col justify-between bg-white">
              <div className="space-y-1.5 text-[10.5px]">
                <div className="flex items-center">
                  <span className="font-bold text-gray-700 w-32 uppercase shrink-0">CLIENT:</span>
                  <span className="font-bold text-gray-900 text-[11px] leading-normal">{clientName || "—"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-gray-700 w-32 uppercase shrink-0">LOCATION:</span>
                  <span className="font-semibold text-gray-900 text-[11px] leading-normal">{location || "—"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-gray-700 w-32 uppercase shrink-0">NUMBER OF PARTICIPANTS:</span>
                  <span className="font-semibold text-gray-900 text-[11px] leading-normal">{numberOfParticipants}</span>
                </div>
              </div>
            </div>

            {/* Right 5 columns: Duration & Bank info */}
            <div className="col-span-5 flex flex-col gap-1.5">
              <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                <span style={{ fontWeight: 700, color: "#374151", textTransform: "uppercase", fontSize: "10.5px" }}>DURATION:</span>
                <span style={{ fontWeight: 700, color: "#111827", fontSize: "10.5px" }}>{duration || "5 Days"}</span>
              </div>

              {/* Payment Information Box with KSOSHTC Navy & Green Accent */}
              <div className="bg-[#1b365d] text-white rounded-md p-2 flex items-start gap-2 border border-[#0d522c] relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#0d522c] rounded-full opacity-60 pointer-events-none"></div>
                <div className="mt-0.5 p-1 bg-white/10 rounded shrink-0">
                  <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V9m0 4h4m-4 4h4m1-11h-4" />
                  </svg>
                </div>
                <div className="text-[9.5px] leading-tight space-y-0.5 z-10">
                  <div className="font-bold text-amber-300 text-[10.5px] uppercase tracking-wider">PAYMENT INFORMATION</div>
                  <div>Bank Name: <span className="font-semibold text-white">{paymentInfo?.bankName || "EQUITY BANK RWANDA"}</span></div>
                  <div>Account No: <span className="font-semibold text-white">{paymentInfo?.accountNo || "4025201372795"}</span></div>
                  <div>Account Name: <span className="font-semibold text-white">{paymentInfo?.accountName || "Kigali Safety OSH Training Center"}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* COST Section Banner */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "10px 0", marginBottom: "12px", background: "#fff", display: "flex", alignItems: "center" }}>
            {/* Left: Cost Per Person */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", borderRight: "1px solid #d1d5db", padding: "0 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "11px", background: "#1b365d", padding: "6px 12px", borderRadius: "4px", letterSpacing: "0.08em", lineHeight: "1", whiteSpace: "nowrap", flexShrink: 0, boxSizing: "border-box" }}>
                COST
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#0d522c", lineHeight: 1.3 }}>{formatAmount(costPerPerson)} FRW</div>
                <div style={{ fontSize: "8.5px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>PER PERSON</div>
              </div>
            </div>

            {/* Right: Total Cost */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "0 16px" }}>
              <div style={{ fontWeight: 700, color: "#222", fontSize: "11px", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>TOTAL COST:</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "17px", fontWeight: 900, color: "#0d522c", lineHeight: 1.3 }}>{formatAmount(totalCost)} FRW</div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "#666" }}>(For {numberOfParticipants} Participants)</div>
              </div>
            </div>
          </div>

          {/* TRAINING MODULES SECTION */}
          <div style={{ marginBottom: "12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff", overflow: "hidden" }}>
            <div style={{ background: "#0d522c", color: "#fff", fontWeight: 700, fontSize: "12px", padding: "6px 12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              TRAINING MODULES
            </div>
            <div style={{ padding: "10px 14px", background: "#fff", display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "20px", rowGap: "10px" }}>
              {modules.map((mod, idx) => (
                <div key={mod.id || idx} style={{ borderBottom: "1px solid #f1f1f1", paddingBottom: "8px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "3px" }}>
                    {/* Badge: use div not span to avoid flex-stretch */}
                    <div style={{
                      background: "#0d522c",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "9px",
                      width: "17px",
                      height: "17px",
                      maxWidth: "17px",
                      maxHeight: "17px",
                      minWidth: "17px",
                      minHeight: "17px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "3px",
                      flexShrink: 0,
                      textAlign: "center",
                      lineHeight: "17px",
                      overflow: "hidden",
                      boxSizing: "border-box",
                      marginTop: "1px",
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontWeight: 700, color: "#1b365d", fontSize: "10px", lineHeight: 1.25, flex: 1 }}>{mod.title}</div>
                  </div>
                  <ul style={{ paddingLeft: "23px", margin: 0, listStyleType: "disc" }}>
                    {mod.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} style={{ fontSize: "8.5px", color: "#444", lineHeight: 1.4, fontWeight: 500, marginBottom: "1px" }}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Column Sub-Footer Info Boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            {/* Box 1: Training Methodology */}
            <div style={{ border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#1b365d", color: "#fff", fontWeight: 700, padding: "7px 4px", textAlign: "center", fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                TRAINING METHODOLOGY
              </div>
              <ul style={{ padding: "8px 8px 8px 20px", margin: 0, listStyleType: "disc" }}>
                {trainingMethodology.map((item, idx) => (
                  <li key={idx} style={{ fontSize: "8.5px", color: "#444", lineHeight: 1.5, fontWeight: 500, marginBottom: "2px" }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Box 2: Included in Training Fee */}
            <div style={{ border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#0d522c", color: "#fff", fontWeight: 700, padding: "7px 4px", textAlign: "center", fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                INCLUDED IN THE TRAINING FEE
              </div>
              <ul style={{ padding: "8px 8px 8px 20px", margin: 0, listStyleType: "disc" }}>
                {includedInFee.map((item, idx) => (
                  <li key={idx} style={{ fontSize: "8.5px", color: "#444", lineHeight: 1.5, fontWeight: 500, marginBottom: "2px" }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Box 3: Payment Terms */}
            <div style={{ border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#1b365d", color: "#fff", fontWeight: 700, padding: "7px 4px", textAlign: "center", fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                PAYMENT TERMS
              </div>
              <ul style={{ padding: "8px 8px 8px 20px", margin: 0, listStyleType: "disc" }}>
                {paymentTerms.map((item, idx) => (
                  <li key={idx} style={{ fontSize: "8.5px", color: "#444", lineHeight: 1.5, fontWeight: 500, marginBottom: "2px" }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Box 4: Additional Information */}
            <div style={{ border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "#0d522c", color: "#fff", fontWeight: 700, padding: "7px 4px", textAlign: "center", fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ADDITIONAL INFORMATION
              </div>
              <ul style={{ padding: "8px 8px 8px 20px", margin: 0, listStyleType: "disc" }}>
                {additionalInfo.map((item, idx) => (
                  <li key={idx} style={{ fontSize: "8.5px", color: "#444", lineHeight: 1.5, fontWeight: 500, marginBottom: "2px" }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* TRAINERS SECTION */}
          <div className="mb-3 border border-gray-300 rounded-md overflow-hidden bg-white">
            <div className="bg-[#0d522c] text-white font-bold text-[11px] py-1 px-3 text-center uppercase tracking-wider">
              TRAINERS
            </div>
            <div className="p-2 bg-white grid grid-cols-2 gap-3 divide-x divide-gray-200">
              {trainers.map((tr, idx) => (
                <div key={tr.id || idx} className={idx > 0 ? "pl-3" : ""}>
                  <div className="font-extrabold text-[#1b365d] text-[10px] uppercase">{tr.name}</div>
                  <div className="font-bold italic text-[#0d522c] text-[9px] mb-0.5 leading-tight">{tr.title}</div>
                  <p className="text-[8px] text-gray-600 mb-1 leading-tight">{tr.bio}</p>
                  {tr.certifications && (
                    <div className="text-[8px] text-gray-700">
                      <span className="font-bold text-gray-900">Certifications: </span>
                      {tr.certifications}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Prepared By & Motto */}
        <div className="mt-auto pt-2 border border-gray-300 rounded-md p-2 relative flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-[10px] uppercase">PREPARED BY:</span>
            <div>
              <span className="font-extrabold text-[#1b365d] text-[10px] block uppercase">{preparedBy?.name || "Jackson DUSABIMANA"}</span>
              <span className="text-[9px] font-semibold text-gray-600">{preparedBy?.title || "Director - KSOSHTC"}</span>
            </div>
          </div>

          {/* Official Stamp Graphic Overlay */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 pointer-events-none">
            <img
              src="/certificate/stamp.webp"
              alt="Official Stamp"
              className="h-16 w-16 opacity-85 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          {/* Motto */}
          <div className="text-right">
            <span className="text-[10px] font-medium text-gray-700">
              Safety today, <span className="font-bold italic text-[#1b365d]">prosperity tomorrow.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
