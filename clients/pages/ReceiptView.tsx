import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Search,
  ExternalLink,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getApiBase } from "@/lib/apiBase";
import { ReceiptPreview } from "@/components/admin/ReceiptPreview";
import type { FeeReceipt } from "@shared/api";

export default function ReceiptView() {
  const { id } = useParams<{ id: string }>();
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: receipt,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FeeReceipt>({
    queryKey: ["public-receipt", id],
    queryFn: async () => {
      if (!id) throw new Error("No receipt ID specified");
      const res = await fetch(`${getApiBase()}/api/receipts/${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error("Receipt not found");
      }
      return res.json();
    },
    enabled: !!id,
    retry: 1,
  });

  const handleDownloadPdf = async () => {
    if (!previewRef.current || !receipt) return;
    setDownloading(true);
    try {
      const el = previewRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const filename = `KSOSHTC_Receipt_${(receipt.invoiceId || receipt.receiptNo || "INV").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.error("[RECEIPT_VIEW] PDF download error:", e);
      alert("Failed to generate PDF. You can also use the browser's Print feature.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/receipt/${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f4f7f5] to-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-[#1B5E3F]/20 border-t-[#1B5E3F] rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Verifying Official Payment Receipt...
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Looking up records for ID: <span className="font-mono font-bold text-primary">{id}</span>
        </p>
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Receipt Not Found</h1>
            <p className="text-sm text-gray-500 mt-1">
              No verified payment receipt was found matching ID:{" "}
              <span className="font-mono font-bold text-gray-800">{id}</span>
            </p>
          </div>

          {/* Search by other ID */}
          <form onSubmit={handleSearch} className="space-y-2 text-left">
            <label className="text-xs font-bold text-gray-600 block">
              Try searching by Invoice ID or Receipt #
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 7395 or KSOSHTC/REC/2026/001"
                className="flex-1 px-3.5 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </div>
          </form>

          <div className="pt-4 border-t flex items-center justify-between text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-primary font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <a
              href="mailto:info@ksoshtc.org"
              className="text-primary hover:underline font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const primaryInvoiceId =
    receipt.invoiceId ||
    (receipt.invoiceDetails && receipt.invoiceDetails[0]?.invoiceNo) ||
    receipt.receiptNo ||
    "INV-001";

  const formattedAmount = Number(receipt.receivedFee || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-[#ecefe9] text-gray-900 flex flex-col">
      {/* TOP VERIFICATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-2xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left Brand & Verification Status */}
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0">
              <img
                src="/logo_transparent.webp"
                alt="KSOSHTC Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <div className="h-7 w-[1px] bg-gray-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#1B5E3F]/10 text-[#1B5E3F] border border-[#1B5E3F]/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED AUTHENTIC
                </span>
                <span className="text-xs font-mono font-bold text-gray-700 hidden md:inline">
                  {primaryInvoiceId}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Kigali Safety OSH Training Center · Official Payment Receipt
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy verification link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Preparing..." : "Download PDF"}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DOCUMENT VIEWPORT */}
      <main className="flex-1 py-8 px-2 sm:px-4 flex flex-col items-center">
        {/* Verification Summary Card */}
        <div className="max-w-[820px] w-full mb-6 print:hidden">
          <div className="bg-white rounded-2xl border border-[#1B5E3F]/30 p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1B5E3F] to-[#164e33] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  OFFICIAL KSOSHTC RECEIPT
                </p>
                <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                  Issued to: {receipt.receivedFrom}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Receipt No: <span className="font-semibold text-gray-900">{receipt.receiptNo}</span> · Date:{" "}
                  <span className="font-semibold text-gray-900">{receipt.receiptDate}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                AMOUNT RECEIVED
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#1B5E3F] font-mono">
                {receipt.currency || "RWF"} {formattedAmount}
              </span>
            </div>
          </div>
        </div>

        {/* The Exact Printable Receipt Canvas */}
        <div className="w-full flex justify-center overflow-x-auto pb-10">
          <div className="min-w-[820px]">
            <ReceiptPreview receipt={receipt} previewRef={previewRef} scale={1} />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500 print:hidden">
        <p>
          &copy; {new Date().getFullYear()} Kigali Safety OSH Training Center (KSOSHTC) · All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
