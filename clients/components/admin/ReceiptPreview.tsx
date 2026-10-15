import React from "react";
import { QRCodeSVG } from "qrcode.react";
import type { FeeReceipt } from "@shared/api";

interface ReceiptPreviewProps {
  receipt: FeeReceipt;
  previewRef?: React.RefObject<HTMLDivElement>;
  scale?: number;
}

// Clean SVG Barcode renderer with explicit proportional scaling
function BarcodeSvg({
  value,
  width = 132,
  height = 26,
}: {
  value: string;
  width?: number;
  height?: number;
}) {
  const str = (value || "REC-001").toUpperCase();
  const bars: { width: number; isSpace: boolean }[] = [];

  // Guard bars
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1.5, isSpace: true });
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1.5, isSpace: true });

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 1;
    bars.push({ width: b1, isSpace: false });
    bars.push({ width: s1, isSpace: true });
    bars.push({ width: b2, isSpace: false });
    bars.push({ width: s2, isSpace: true });
  }

  // Guard bars end
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1.5, isSpace: true });
  bars.push({ width: 2.5, isSpace: false });

  const totalUnits = bars.reduce((acc, b) => acc + b.width, 0);
  const scale = (width - 4) / (totalUnits || 1);

  let currentX = 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
      >
        {bars.map((bar, idx) => {
          const barW = Math.max(1, bar.width * scale);
          const x = currentX;
          currentX += bar.width * scale;
          if (bar.isSpace) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={barW}
              height={height}
              fill="#111827"
            />
          );
        })}
      </svg>
    </div>
  );
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  receipt,
  previewRef,
  scale = 1,
}) => {
  const currencySymbol = receipt.currency || "RWF";
  const formattedReceivedFee = Number(receipt.receivedFee || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Calculate installment totals
  const totalDue = (receipt.installments || []).reduce(
    (acc, row) => acc + (Number(row.dueFee) || 0),
    0
  );
  const totalReceived = (receipt.installments || []).reduce(
    (acc, row) => acc + (Number(row.receivedFee) || 0),
    0
  );
  const totalBalance = (receipt.installments || []).reduce(
    (acc, row) => acc + (Number(row.balanceFee) || 0),
    0
  );

  const primaryInvoiceId =
    receipt.invoiceId ||
    (receipt.invoiceDetails && receipt.invoiceDetails[0]?.invoiceNo) ||
    receipt.receiptNo ||
    "INV-001";

  // Browser verification URL for scanning
  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/receipt/${encodeURIComponent(primaryInvoiceId)}`
      : `https://ksoshtc.org/receipt/${encodeURIComponent(primaryInvoiceId)}`;

  const showStamp = receipt.showStamp !== false;
  const showSignature = receipt.showSignature !== false;
  const stampUrl = receipt.stampUrl || "/certificate/stamp.webp";
  const signatoryName = receipt.signatoryName || "Emmanuel NIYOBUHUNGIRO";
  const signatoryTitle =
    receipt.signatoryTitle || "Authorized Signatory - Finance & Administration";

  return (
    <div
      ref={previewRef}
      id="receipt-print-area"
      className="bg-white text-[#1a1a1a] shadow-2xl mx-auto print:shadow-none print:m-0 rounded-sm overflow-hidden"
      style={{
        width: "820px",
        minHeight: "1140px",
        padding: "44px 50px",
        fontFamily: "'Work Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
        position: "relative",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      {/* TOP BRAND ACCENT BAR */}
      <div
        className="absolute top-0 left-0 right-0 h-[4.5px]"
        style={{
          background: "linear-gradient(90deg, #1B5E3F 0%, #1E3A5F 52%, #D4AF37 100%)",
        }}
      />

      {/* HEADER SECTION - BALANCED, NO CONFLICTS */}
      <div className="flex justify-between items-start border-b border-gray-200/90 pb-4 mb-5 gap-4">
        {/* Left: Logo & Company Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-2">
          <div className="shrink-0 pt-0.5">
            <img
              src={receipt.logoUrl || "/logo_transparent.webp"}
              alt="KSOSHTC Logo"
              crossOrigin="anonymous"
              className="h-16 w-auto max-w-[125px] object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="leading-snug min-w-0">
            <h1 className="text-[14.5px] font-extrabold uppercase tracking-tight text-[#1E3A5F] leading-tight">
              {receipt.companyName || "Kigali Safety OSH Training Center (KSOSHTC)"}
            </h1>
            <p className="text-[11px] font-bold text-[#1B5E3F] mt-0.5">
              {receipt.companyTagline || "Safety today, prosperity tomorrow."}
            </p>
            <p className="text-[10.5px] text-gray-600 mt-1 leading-relaxed">
              {receipt.companyAddress ||
                "Kicukiro, Kigali, Rwanda · Tel: +250 785 072 512 · ksoshtc@gmail.com"}
            </p>
            <div className="text-[10px] font-semibold text-gray-700 mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
              <span className="px-2 py-0.5 rounded bg-[#1B5E3F]/10 text-[#1B5E3F] font-bold border border-[#1B5E3F]/20">
                {receipt.panNumber ? `Accreditation: ${receipt.panNumber}` : "RTB Accredited Institution"}
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-bold border border-gray-200">
                {receipt.gstinNumber ? `Reg/TIN: ${receipt.gstinNumber}` : "TIN: 108520137"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Official Receipt Identification & Digital Verification */}
        <div className="w-[245px] shrink-0 flex flex-col items-end text-right">
          {/* Official Receipt Badge */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Official Receipt
            </span>
          </div>

          {/* Receipt Number (Unwrapped, Monospace) */}
          <div className="mt-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
              Receipt No
            </span>
            <span className="text-[14px] font-mono font-black text-[#1E3A5F] tracking-tight block leading-tight whitespace-nowrap">
              {receipt.receiptNo}
            </span>
          </div>

          {/* Digital Verification Dock (QR + Barcode seamlessly framed together) */}
          <div className="mt-2 flex items-center gap-2.5 bg-[#f8faf9] p-2 rounded-xl border border-gray-200 shadow-2xs w-full justify-between">
            {/* Scannable QR Code */}
            <div className="bg-white p-1 rounded-lg border border-gray-200/90 shadow-2xs flex flex-col items-center shrink-0">
              <QRCodeSVG
                value={verificationUrl}
                size={44}
                level="M"
                includeMargin={false}
              />
              <span className="text-[6.5px] font-extrabold text-[#1B5E3F] uppercase tracking-tighter mt-0.5 whitespace-nowrap">
                Scan to Verify
              </span>
            </div>

            {/* Scannable Barcode */}
            <div className="flex flex-col items-center flex-1 min-w-0 pr-0.5">
              <BarcodeSvg value={primaryInvoiceId} width={134} height={25} />
              <div className="flex items-center justify-between w-full mt-0.5 px-0.5">
                <span className="text-[7.5px] uppercase font-bold text-gray-400">Invoice ID</span>
                <span className="text-[9px] font-mono font-extrabold text-[#1E3A5F] bg-white px-1.5 py-0.2 rounded border border-gray-200">
                  {primaryInvoiceId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METADATA 2-COLUMN SECTION */}
      <div className="grid grid-cols-2 gap-6 items-start mb-5">
        {/* Left Column: Transaction Details */}
        <div className="space-y-1.5 text-[12px] bg-[#fbfdfc] p-3.5 rounded-xl border border-gray-100">
          <div className="flex items-center py-0.5">
            <span className="w-28 shrink-0 font-bold text-gray-600">Receipt #</span>
            <span className="font-semibold text-gray-900 font-mono text-[12px] whitespace-nowrap">
              {receipt.receiptNo}
            </span>
          </div>
          <div className="flex items-center py-0.5">
            <span className="w-28 shrink-0 font-bold text-gray-600">Invoice ID</span>
            <span className="font-mono font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-1.5 py-0.5 rounded text-[11.5px] whitespace-nowrap">
              {primaryInvoiceId}
            </span>
          </div>
          <div className="flex items-center py-0.5">
            <span className="w-28 shrink-0 font-bold text-gray-600">Receipt Date</span>
            <span className="text-gray-900 font-medium text-[12px] whitespace-nowrap">{receipt.receiptDate}</span>
          </div>
          <div className="flex items-center py-0.5">
            <span className="w-28 shrink-0 font-bold text-gray-600">Received In</span>
            <span className="text-gray-900 font-semibold text-[12px] truncate">{receipt.receivedIn || "Bank / MoMo"}</span>
          </div>
          <div className="flex items-center py-0.5">
            <span className="w-28 shrink-0 font-bold text-gray-600">Cheque/Tran. No</span>
            <span className="font-mono text-gray-800 text-[11.5px] truncate">{receipt.chequeTranNo || "—"}</span>
          </div>
          <div className="flex items-center py-0.5">
            <span className="w-28 shrink-0 font-bold text-gray-600">Received Fee</span>
            <span className="font-bold text-[#1B5E3F] text-[12.5px] whitespace-nowrap">
              {currencySymbol} {formattedReceivedFee}
            </span>
          </div>
        </div>

        {/* Right Column: Payer Card & Prominent Amount Pill */}
        <div className="text-[12.5px] flex flex-col items-end">
          <div className="w-full text-left bg-gradient-to-br from-white to-[#f8faf9] p-3 rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-[10px] font-bold text-[#1E3A5F] uppercase tracking-wider">
              Received From :
            </p>
            <p className="font-extrabold text-[14px] text-gray-900 uppercase mt-0.5 tracking-tight">
              {receipt.receivedFrom || "Student Name"}
            </p>
            <p className="text-[11.5px] text-gray-700 mt-1 font-medium">
              <span className="text-gray-500 font-semibold">ID Card No. :</span>{" "}
              {receipt.idCardNo || "—"}
            </p>
            {receipt.payerPhone && (
              <p className="text-[11px] text-gray-600 mt-0.5">
                <span className="text-gray-500 font-semibold">Tel:</span> {receipt.payerPhone}
              </p>
            )}
            {receipt.payerEmail && (
              <p className="text-[11px] text-gray-600">
                <span className="text-gray-500 font-semibold">Email:</span> {receipt.payerEmail}
              </p>
            )}
          </div>

          {/* Site Colors Amount Pill Badge (Forest Green with Gold border) */}
          <div
            className="mt-3 px-6 py-2.5 rounded-xl text-white font-extrabold text-[18px] text-center w-full max-w-[280px] shadow-sm tracking-wide"
            style={{
              background: "linear-gradient(135deg, #1B5E3F 0%, #164e33 100%)",
              border: "2px solid #D4AF37",
            }}
          >
            {currencySymbol} {formattedReceivedFee}
          </div>
        </div>
      </div>

      {/* SECTION: INVOICE DETAILS */}
      <div className="mt-4 mb-4">
        <h2 className="text-[13px] font-bold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#1B5E3F]" />
          Invoice Details
        </h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#1E3A5F] text-white font-bold border-b border-[#1E3A5F]">
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Received against Invoice #</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Package Details</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Fees Details</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Invoice Date</th>
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">
                  Due Fee ({currencySymbol})
                </th>
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">
                  Received Fee ({currencySymbol})
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.invoiceDetails && receipt.invoiceDetails.length > 0 ? (
                receipt.invoiceDetails.map((inv, idx) => (
                  <tr
                    key={inv.id || idx}
                    className={`border-b border-gray-200 ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#fcfdfc]"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[#1E3A5F] font-mono">
                      {inv.invoiceNo || primaryInvoiceId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      {inv.packageDetails}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{inv.feesDetails}</td>
                    <td className="py-2.5 px-3 text-gray-700">{inv.invoiceDate}</td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {Number(inv.dueFee || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1B5E3F]">
                      {Number(inv.receivedFee || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-gray-400 italic">
                    No invoice items specified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: INSTALLMENT PAYMENTS */}
      <div className="mt-4 mb-4">
        <h2 className="text-[13px] font-bold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
          Installment Payments
        </h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#1E3A5F] text-white font-bold border-b border-[#1E3A5F]">
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Due Date</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Invoice</th>
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">Due Fee</th>
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">Received Fee</th>
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">Balance Fee</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Payment Details</th>
              </tr>
            </thead>
            <tbody>
              {receipt.installments && receipt.installments.length > 0 ? (
                receipt.installments.map((inst, idx) => (
                  <tr
                    key={inst.id || idx}
                    className={`border-b border-gray-200 ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#fcfdfc]"
                    }`}
                  >
                    <td className="py-2.5 px-3">{inst.dueDate}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-gray-700">
                      {inst.invoiceNo}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {Number(inst.dueFee || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1B5E3F]">
                      {Number(inst.receivedFee || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">
                      {Number(inst.balanceFee || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{inst.paymentDetails}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-gray-400 italic">
                    No installment records.
                  </td>
                </tr>
              )}
              {/* Summary / Total Row with Site Colors */}
              <tr className="bg-[#f0f7f3] font-bold text-[#1E3A5F] border-t-2 border-[#1B5E3F]">
                <td className="py-2.5 px-3" colSpan={2}>
                  TOTAL ({currencySymbol})
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-[#1E3A5F]">
                  {totalDue.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-[#1B5E3F]">
                  {totalReceived.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-amber-800">
                  {totalBalance.toLocaleString()}
                </td>
                <td className="py-2.5 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SIGNATURE & OFFICIAL STAMP SECTION */}
      {(showStamp || showSignature) && (
        <div className="mt-4 mb-4 pt-3 pb-3 px-4 border border-[#1B5E3F]/20 bg-[#fbfdfc] rounded-xl relative flex items-center justify-between">
          {/* Left Signatory Box */}
          <div className="flex flex-col items-start relative z-10">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
              AUTHORIZED BY:
            </span>
            {showSignature && (
              <div className="relative mb-0.5">
                {/* Simulated authentic calligraphic signature */}
                <p
                  className="text-[#1B5E3F] text-[34px] font-normal leading-none select-none"
                  style={{
                    fontFamily: '"Mrs Saint Delafield", cursive, Georgia, serif',
                    transform: "rotate(-3deg)",
                  }}
                >
                  {signatoryName.slice(0, 1)}.{signatoryName.split(" ").slice(-1)[0]?.slice(0, 1) || "N"}.
                </p>
              </div>
            )}
            <div className="w-48 h-[1px] bg-gray-400 my-1" />
            <p className="font-extrabold text-[11px] text-gray-900 uppercase tracking-tight">
              {signatoryName}
            </p>
            <p className="text-[10px] font-semibold text-gray-600">{signatoryTitle}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Signed &amp; Approved: {receipt.receiptDate}
            </p>
          </div>

          {/* Center Official Stamp with realistic ink blend */}
          {showStamp && (
            <div className="absolute left-[54%] -translate-x-1/2 -top-5 pointer-events-none z-20">
              <div className="relative transform -rotate-6">
                <img
                  src={stampUrl}
                  alt="Official Stamp"
                  crossOrigin="anonymous"
                  className="h-28 w-28 opacity-90 object-contain drop-shadow-sm"
                  style={{ mixBlendMode: "multiply" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Right Verification Mark */}
          <div className="text-right z-10 flex flex-col items-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B5E3F]/10 text-[#1B5E3F] text-[10px] font-bold border border-[#1B5E3F]/30">
              <span>OFFICIAL RECEIPT SEAL</span>
            </div>
            <p className="text-[9.5px] text-[#1E3A5F] mt-1 font-mono font-bold">
              VERIFIED: {primaryInvoiceId}
            </p>
            <p className="text-[8.5px] italic text-gray-400 mt-0.5">
              Kigali Safety &amp; OSH Training Center
            </p>
          </div>
        </div>
      )}

      {/* SECTION: TERMS & CONDITIONS */}
      <div className="mt-3 text-[10.5px] text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
        <h3 className="font-extrabold uppercase text-[11px] text-[#1E3A5F] tracking-wider mb-1.5">
          TERMS &amp; CONDITIONS
        </h3>
        <ol className="list-decimal pl-4 space-y-1">
          {receipt.termsAndConditions && receipt.termsAndConditions.length > 0
            ? receipt.termsAndConditions.map((term, idx) => (
                <li key={idx} className="pl-1">
                  {term}
                </li>
              ))
            : null}
        </ol>

        {receipt.policyUrl && (
          <p className="mt-2 text-[#1B5E3F] font-semibold underline text-[10.5px]">
            {receipt.policyUrl}
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-5 pt-2 flex justify-between items-center text-[9.5px] text-gray-400 border-t border-gray-100">
        <p>Official Computer Generated Payment Receipt · KSOSHTC</p>
        <p className="font-mono">
          Online Verification: {verificationUrl.replace(/^https?:\/\//, "")}
        </p>
        <p>Page 1 of 1</p>
      </div>
    </div>
  );
};
