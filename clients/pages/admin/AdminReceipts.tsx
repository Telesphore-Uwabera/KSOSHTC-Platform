import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Download,
  Eye,
  Send,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  CreditCard,
  Building,
  Mail,
  Receipt,
  X,
  ChevronDown,
  ChevronUp,
  Stamp,
  PenTool,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ReceiptPreview } from "../../components/admin/ReceiptPreview";
import type {
  FeeReceipt,
  ReceiptInvoiceItem,
  ReceiptInstallmentItem,
  User as UserType,
} from "@shared/api";
import { DEFAULT_RECEIPT_TERMS } from "@shared/api";
import { adminFetch } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";
import { toast } from "sonner";

export default function AdminReceipts() {
  const [receipts, setReceipts] = useState<FeeReceipt[]>([]);
  const [learners, setLearners] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "editor">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);

  // Form State - Invoice ID as Primary Key
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState("7395");
  const [receiptNo, setReceiptNo] = useState("KSOSHTC/REC/2026/7395");
  const [receiptDate, setReceiptDate] = useState("05 October 2026");
  const [receivedIn, setReceivedIn] = useState("Equity Bank Rwanda / MoMo");
  const [chequeTranNo, setChequeTranNo] = useState("");
  const [receivedFee, setReceivedFee] = useState<number | string>(150000);
  const [currency, setCurrency] = useState("RWF"); // Default to RWF

  // Payer State
  const [receivedFrom, setReceivedFrom] = useState("EMMANUEL NIYOBUHUNGIRO");
  const [idCardNo, setIdCardNo] = useState("7395");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("+250 785 072 512");

  // Signature and Stamp State
  const [showStamp, setShowStamp] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [signatoryName, setSignatoryName] = useState("Emmanuel NIYOBUHUNGIRO");
  const [signatoryTitle, setSignatoryTitle] = useState("Authorized Signatory - Finance & Administration");
  const [stampUrl, setStampUrl] = useState("/certificate/stamp.webp");

  // Company Details - Kigali Safety OSH Training Center
  const [companyName, setCompanyName] = useState("Kigali Safety OSH Training Center (KSOSHTC)");
  const [companyTagline, setCompanyTagline] = useState("Safety today, prosperity tomorrow.");
  const [companyAddress, setCompanyAddress] = useState(
    "Kicukiro, Kigali, Rwanda · Phone: +250 785 072 512 · ksoshtc@gmail.com"
  );
  const [panNumber, setPanNumber] = useState("RTB Accredited Institution");
  const [gstinNumber, setGstinNumber] = useState("TIN: 108520137");
  const [logoUrl, setLogoUrl] = useState("/logo_transparent.webp");

  // Invoice & Installments
  const [invoiceDetails, setInvoiceDetails] = useState<ReceiptInvoiceItem[]>([
    {
      id: "inv-1",
      invoiceNo: "7395",
      packageDetails: "Occupational Safety and Health (OSH) Training Course",
      feesDetails: "Course Fees",
      invoiceDate: "05 Oct 2026",
      dueFee: 150000,
      receivedFee: 150000,
    },
  ]);

  const [installments, setInstallments] = useState<ReceiptInstallmentItem[]>([
    {
      id: "inst-1",
      dueDate: "05 Oct 2026",
      invoiceNo: "7395",
      dueFee: 150000,
      receivedFee: 150000,
      balanceFee: 0,
      paymentDetails: "KSOSHTC/REC/7395 Equity Bank Rwanda",
    },
  ]);

  const [termsText, setTermsText] = useState(DEFAULT_RECEIPT_TERMS.join("\n"));
  const [policyUrl, setPolicyUrl] = useState(
    "https://ksoshtc.org/terms"
  );

  const previewRef = useRef<HTMLDivElement>(null);
  const modalPreviewRef = useRef<HTMLDivElement>(null);

  // Load Receipts and Learners
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`${getApiBase()}/api/receipts`);
      if (res.ok) {
        const data = await res.json();
        setReceipts(data || []);
      }
    } catch (e) {
      console.error("Error loading receipts:", e);
      toast.error("Failed to load receipts list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLearners = async () => {
    try {
      const res = await adminFetch(`${getApiBase()}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setLearners(Array.isArray(data) ? data : data.users || []);
      }
    } catch { }
  };

  useEffect(() => {
    fetchReceipts();
    fetchLearners();
  }, []);

  const generateNewInvoiceId = () => {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `${randomSeq}`;
  };

  const resetForm = () => {
    const newInv = generateNewInvoiceId();
    setEditingId(null);
    setInvoiceId(newInv);
    setReceiptNo(`KSOSHTC/REC/2026/${newInv}`);
    setReceiptDate(new Date().toLocaleDateString("en-GB"));
    setReceivedIn("Equity Bank Rwanda / MoMo");
    setChequeTranNo("");
    setReceivedFee(150000);
    setCurrency("RWF"); // Default RWF

    setReceivedFrom("");
    setIdCardNo(newInv);
    setPayerEmail("");
    setPayerPhone("");

    setShowStamp(true);
    setShowSignature(true);
    setSignatoryName("Emmanuel NIYOBUHUNGIRO");
    setSignatoryTitle("Authorized Signatory - Finance & Administration");
    setCompanyName("Kigali Safety OSH Training Center (KSOSHTC)");
    setCompanyTagline("Safety today, prosperity tomorrow.");
    setCompanyAddress("Kicukiro, Kigali, Rwanda · Phone: +250 785 072 512 · ksoshtc@gmail.com");
    setPanNumber("RTB Accredited Institution");
    setGstinNumber("TIN: 108520137");
    setPolicyUrl("https://ksoshtc.org/terms");

    setInvoiceDetails([
      {
        id: "inv-1",
        invoiceNo: newInv,
        packageDetails: "Occupational Safety and Health Course",
        feesDetails: "Course Fees",
        invoiceDate: new Date().toLocaleDateString("en-GB"),
        dueFee: 150000,
        receivedFee: 150000,
      },
    ]);

    setInstallments([
      {
        id: "inst-1",
        dueDate: new Date().toLocaleDateString("en-GB"),
        invoiceNo: newInv,
        dueFee: 150000,
        receivedFee: 150000,
        balanceFee: 0,
        paymentDetails: `KSOSHTC/REC/${newInv} Equity Bank`,
      },
    ]);

    setTermsText(DEFAULT_RECEIPT_TERMS.join("\n"));
  };

  const handleCreateNew = () => {
    resetForm();
    setActiveTab("editor");
  };

  const handleEdit = (r: FeeReceipt) => {
    setEditingId(r.invoiceId || r.id);
    setInvoiceId(r.invoiceId || r.id);
    setReceiptNo(r.receiptNo);
    setReceiptDate(r.receiptDate);
    setReceivedIn(r.receivedIn || "SBI");
    setChequeTranNo(r.chequeTranNo || "");
    setReceivedFee(r.receivedFee);
    setCurrency(r.currency || "RWF"); // Default RWF

    setReceivedFrom(r.receivedFrom);
    setIdCardNo(r.idCardNo || "");
    setPayerEmail(r.payerEmail || "");
    setPayerPhone(r.payerPhone || "");

    setShowStamp(r.showStamp !== false);
    setShowSignature(r.showSignature !== false);
    setSignatoryName(r.signatoryName || "Emmanuel NIYOBUHUNGIRO");
    setSignatoryTitle(r.signatoryTitle || "Authorized Signatory - Finance & Administration");
    setStampUrl(r.stampUrl || "/certificate/stamp.webp");

    setCompanyName(r.companyName || "Kigali Safety OSH Training Center (KSOSHTC)");
    setCompanyTagline(r.companyTagline || "Safety today, prosperity tomorrow.");
    setCompanyAddress(r.companyAddress || "Kicukiro, Kigali, Rwanda · Phone: +250 785 072 512 · ksoshtc@gmail.com");
    setPanNumber(r.panNumber || "RTB Accredited Institution");
    setGstinNumber(r.gstinNumber || "TIN: 108520137");
    setLogoUrl(r.logoUrl || "/logo_transparent.webp");
    setPolicyUrl(r.policyUrl || "https://ksoshtc.org/terms");

    setInvoiceDetails(r.invoiceDetails || []);
    setInstallments(r.installments || []);
    setTermsText((r.termsAndConditions || DEFAULT_RECEIPT_TERMS).join("\n"));
    setPolicyUrl(r.policyUrl || "");

    setActiveTab("editor");
  };

  // Quick auto-populate from registered learner
  const handleSelectLearner = (userId: string) => {
    const learner = learners.find((l) => l.id === userId);
    if (!learner) return;

    setReceivedFrom(learner.name);
    setPayerEmail(learner.email);
    if (learner.phone) setPayerPhone(learner.phone);
    const studentIdCard = learner.idCardNo || learner.id.slice(0, 8).toUpperCase();
    setIdCardNo(studentIdCard);
    if (!invoiceId) setInvoiceId(generateNewInvoiceId());

    const sectorTitle =
      learner.sector === "construction"
        ? "OSH in Construction"
        : learner.sector === "mining"
          ? "OSH in Mining"
          : learner.sector === "industrial-safety"
            ? "OSH in Industrial Safety"
            : learner.sector === "food-safety"
              ? "Food Safety"
              : learner.sector === "safety-management"
                ? "Safety Management"
                : learner.sector === "safe-lifting-operations"
                  ? "Safe Lifting Operations"
                  : learner.sector === "fire-safety-and-egress"
                    ? "Fire Safety and Egress"
                    : learner.sector === "esg"
                      ? "Environmental Social and Governance (ESG)"
                      : learner.sector === "first-aid"
                        ? "First Aid & CPR"
                        : "Occupational Safety and Health Course";

    setInvoiceDetails([
      {
        id: "inv-" + Date.now(),
        invoiceNo: learnerInv,
        packageDetails: sectorTitle,
        feesDetails: "Course Fees",
        invoiceDate: new Date().toLocaleDateString("en-GB"),
        dueFee: Number(receivedFee) || 0,
        receivedFee: Number(receivedFee) || 0,
      },
    ]);

    toast.success(`Selected learner: ${learner.name}`);
  };

  const currentReceiptObject: FeeReceipt = {
    id: invoiceId, // Primary key is invoice ID
    invoiceId: invoiceId || "INV-001",
    receiptNo: receiptNo || "3SLSA/15081",
    receiptDate: receiptDate || new Date().toLocaleDateString("en-GB"),
    receivedIn,
    chequeTranNo,
    receivedFee: Number(receivedFee) || 0,
    currency: currency || "RWF", // Default RWF
    receivedFrom,
    idCardNo,
    payerEmail,
    payerPhone,
    companyName,
    companyTagline,
    companyAddress,
    panNumber,
    gstinNumber,
    logoUrl,
    signatoryName,
    signatoryTitle,
    showStamp,
    showSignature,
    stampUrl,
    invoiceDetails,
    installments,
    termsAndConditions: termsText.split("\n").filter((t) => t.trim().length > 0),
    policyUrl,
    createdAt: new Date().toISOString(),
  };

  // Save to backend
  const handleSave = async () => {
    if (!receivedFrom.trim()) {
      toast.error("Please enter the student / payer name.");
      return;
    }
    if (!invoiceId.trim()) {
      toast.error("Invoice ID is required.");
      return;
    }

    try {
      setSaving(true);
      const url = editingId
        ? `${getApiBase()}/api/receipts/${editingId}`
        : `${getApiBase()}/api/receipts`;
      const method = editingId ? "PUT" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentReceiptObject),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save receipt");
      }

      toast.success(editingId ? "Receipt updated successfully!" : "Receipt created successfully!");
      await fetchReceipts();
      setActiveTab("list");
    } catch (e: any) {
      toast.error(e.message || "Error saving receipt.");
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF Canvas
  const generatePdfBlob = async (customEl?: HTMLElement | null): Promise<{ pdf: jsPDF; base64: string } | null> => {
    const el = customEl || previewRef.current;
    if (!el) {
      toast.error("Receipt preview element not ready.");
      return null;
    }

    const canvas = await html2canvas(el, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

    const base64 = pdf.output("datauristring");
    return { pdf, base64 };
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const res = await generatePdfBlob();
      if (!res) return;
      const cleanNo = (invoiceId || receiptNo || "receipt").replace(/[^a-zA-Z0-9_-]/g, "_");
      res.pdf.save(`Receipt_${cleanNo}.pdf`);
      toast.success("Receipt PDF downloaded successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF download.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Trigger Print
  const handlePrint = () => {
    const el = previewRef.current;
    if (!el) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const headStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${invoiceId || receiptNo}</title>
          ${headStyles}
          <style>
            @page { size: A4 portrait; margin: 6mm; }
            body { margin: 0; background: #fff !important; }
            #receipt-print-area { box-shadow: none !important; width: 100% !important; padding: 0 !important; }
          </style>
        </head>
        <body>
          ${el.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 4000);
  };

  // Send Receipt Email to Payer
  const handleSendEmail = async () => {
    const emailToSend = targetEmail.trim() || payerEmail.trim();
    if (!emailToSend || !emailToSend.includes("@")) {
      toast.error("Please enter a valid payer email address.");
      return;
    }

    try {
      setIsSendingEmail(true);
      toast.info("Generating certified PDF attachment and sending email...");

      // Render from the main preview or modal preview
      const pdfResult = await generatePdfBlob(previewRef.current);
      if (!pdfResult) throw new Error("Could not render receipt PDF.");

      let idToUse = invoiceId || editingId;
      if (!idToUse) {
        idToUse = "INV-" + Date.now();
        setInvoiceId(idToUse);
      }

      // Save receipt first to record
      await adminFetch(`${getApiBase()}/api/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentReceiptObject, id: idToUse, invoiceId: idToUse }),
      }).catch(() => { });

      const sendRes = await adminFetch(
        `${getApiBase()}/api/receipts/${idToUse}/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailToSend,
            payerName: receivedFrom,
            receiptNo: `${receiptNo} (Invoice #${invoiceId})`,
            amount: receivedFee,
            currency: currency || "RWF",
            packageName: invoiceDetails[0]?.packageDetails || "Course Fees",
            pdfBase64: pdfResult.base64,
          }),
        }
      );

      if (!sendRes.ok) {
        const err = await sendRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to deliver receipt email.");
      }

      toast.success(`Signed receipt PDF sent to ${emailToSend}!`);
      setShowEmailModal(false);
      await fetchReceipts();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to send receipt email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Delete Receipt
  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete invoice record "${id}"?`)) return;
    try {
      const res = await adminFetch(`${getApiBase()}/api/receipts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Receipt record deleted.");
        setReceipts((prev) => prev.filter((r) => r.id !== id && r.invoiceId !== id));
      }
    } catch {
      toast.error("Failed to delete receipt.");
    }
  };

  // Dynamic row helpers
  const addInvoiceRow = () => {
    setInvoiceDetails([
      ...invoiceDetails,
      {
        id: "inv-" + Date.now(),
        invoiceNo: invoiceId || "",
        packageDetails: "",
        feesDetails: "Course Fees",
        invoiceDate: new Date().toLocaleDateString("en-GB"),
        dueFee: 0,
        receivedFee: 0,
      },
    ]);
  };

  const removeInvoiceRow = (idx: number) => {
    setInvoiceDetails(invoiceDetails.filter((_, i) => i !== idx));
  };

  const addInstallmentRow = () => {
    setInstallments([
      ...installments,
      {
        id: "inst-" + Date.now(),
        dueDate: new Date().toLocaleDateString("en-GB"),
        invoiceNo: invoiceId || "",
        dueFee: 0,
        receivedFee: 0,
        balanceFee: 0,
        paymentDetails: `${receiptNo} ${receivedIn}`,
      },
    ]);
  };

  const removeInstallmentRow = (idx: number) => {
    setInstallments(installments.filter((_, i) => i !== idx));
  };

  const updateInstallment = (idx: number, field: keyof ReceiptInstallmentItem, val: any) => {
    const updated = [...installments];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === "dueFee" || field === "receivedFee") {
      const d = Number(field === "dueFee" ? val : updated[idx].dueFee) || 0;
      const r = Number(field === "receivedFee" ? val : updated[idx].receivedFee) || 0;
      updated[idx].balanceFee = Math.max(0, d - r);
    }
    setInstallments(updated);
  };

  const filteredReceipts = receipts.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.invoiceId || "").toLowerCase().includes(q) ||
      (r.receiptNo || "").toLowerCase().includes(q) ||
      (r.receivedFrom || "").toLowerCase().includes(q) ||
      (r.idCardNo || "").toLowerCase().includes(q) ||
      (r.payerEmail || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" /> Finance &amp; Fee Payments
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Student Fee Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Official receipt generator with authentic digital stamp, signature, and RWF default currency.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "editor" ? (
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Back to Invoices List
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> New Receipt / Invoice
            </button>
          )}
        </div>
      </div>

      {/* ===================== LIST VIEW ===================== */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Invoice ID, student, or receipt #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Default Currency: <strong>RWF</strong></span>
              <button
                type="button"
                onClick={fetchReceipts}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-3 py-2 border rounded-xl hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading receipts and invoices...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700">No payment receipts found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Generate official receipts with automatic primary Invoice IDs, RWF currency, and official stamp.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-xl"
              >
                Create Receipt Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-bold text-primary">Invoice ID</th>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Student / Payer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Certified</th>
                    <th className="py-3 px-4">Email Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReceipts.map((r) => (
                    <tr key={r.invoiceId || r.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {r.invoiceId || r.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{r.receiptNo}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{r.receivedFrom}</p>
                        <p className="text-xs text-gray-500">
                          ID: {r.idCardNo || "—"} {r.payerEmail ? `· ${r.payerEmail}` : ""}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{r.receiptDate}</td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-emerald-700">
                          {r.currency || "RWF"} {Number(r.receivedFee || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {r.showStamp !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Stamp className="w-3 h-3 text-emerald-600" /> Stamped
                          </span>
                        ) : (
                          <span className="text-gray-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {r.sentAt ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Sent ({new Date(r.sentAt).toLocaleDateString()})
                          </span>
                        ) : (
                          <span className="text-gray-400">Not sent yet</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(r)}
                            title="Edit & View Document"
                            className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleEdit(r);
                              setTargetEmail(r.payerEmail || "");
                              setShowEmailModal(true);
                            }}
                            title="Preview & Send to Payer"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.invoiceId || r.id)}
                            title="Delete"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== EDITOR: DOCUMENT ON TOP, FORM BENEATH ===================== */}
      {activeTab === "editor" && (
        <div className="space-y-8">
          {/* Action Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase text-gray-400">Invoice ID:</span>
                <span className="font-mono font-bold text-primary text-sm">{invoiceId}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase text-gray-400">Receipt #:</span>
                <span className="font-bold text-gray-800 text-sm">{receiptNo}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>

              <button
                type="button"
                disabled={isExportingPdf}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExportingPdf ? "Generating..." : "Download PDF"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetEmail(payerEmail);
                  setShowEmailModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" /> Preview &amp; Send to Payer
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Receipt" : "Save Receipt"}
              </button>
            </div>
          </div>

          {/* 1. EDIT RECEIPT & INVOICE DATA (FORM COMES FIRST) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Edit Receipt &amp; Invoice Data
              </h2>
              <span className="text-xs text-gray-500">
                All changes reflect directly on the document preview below
              </span>
            </div>

            {/* Row 1: Auto-fill from Learners */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Auto-fill from Registered Learners (Optional)
              </label>
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handleSelectLearner(e.target.value);
                  }}
                  className="w-full appearance-none px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10 shadow-xs transition cursor-pointer"
                >
                  <option value="">— Select learner to auto-populate —</option>
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.idCardNo ? `[${l.idCardNo}]` : ""} ({l.email})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Row 2: Core Identifiers & Payment Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Receipt className="w-4 h-4 text-primary" /> Receipt &amp; Payment Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Invoice ID */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Invoice ID *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={invoiceId}
                      onChange={(e) => setInvoiceId(e.target.value)}
                      placeholder="e.g. 7395"
                      className="w-full px-3 py-2 text-sm font-mono font-bold border-2 border-primary/40 rounded-xl focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setInvoiceId(generateNewInvoiceId())}
                      title="Generate new ID"
                      className="p-2 border rounded-xl hover:bg-gray-50 text-gray-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Receipt # */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Receipt #</label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>

                {/* Receipt Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Receipt Date</label>
                  <input
                    type="text"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>

                {/* Received Fee */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Received Fee (Current Payment)
                  </label>
                  <input
                    type="number"
                    value={receivedFee}
                    onChange={(e) => setReceivedFee(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl font-bold text-emerald-800"
                  />
                </div>

                {/* Currency: Default RWF */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Currency (Default: RWF)
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2 text-sm border border-gray-200 rounded-xl font-bold text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-9 shadow-xs transition cursor-pointer"
                    >
                      <option value="RWF">RWF (Rwanda Francs) — Default</option>
                      <option value="₹">₹ (INR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Received In */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Received In (Bank / Account / MoMo)
                  </label>
                  <input
                    type="text"
                    value={receivedIn}
                    onChange={(e) => setReceivedIn(e.target.value)}
                    placeholder="Equity Bank, MoMo, SBI, Cash"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>

                {/* Cheque / Tran. Number */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cheque / Tran. Number
                  </label>
                  <input
                    type="text"
                    value={chequeTranNo}
                    onChange={(e) => setChequeTranNo(e.target.value)}
                    placeholder="e.g. TXN987265 or Bank Ref ID"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Student / Payer Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <User className="w-4 h-4 text-primary" /> Student / Payer Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Received From (Student / Payer Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={receivedFrom}
                    onChange={(e) => setReceivedFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ID Card No.</label>
                  <input
                    type="text"
                    value={idCardNo}
                    onChange={(e) => setIdCardNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payer Email (For Receipt PDF Delivery)
                  </label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="learner@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Telephone / WhatsApp</label>
                  <input
                    type="text"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Signature & Stamp Configuration */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Stamp className="w-4 h-4 text-primary" /> Official Stamp &amp; Authorized Signature
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
                  <input
                    type="checkbox"
                    id="stamp-toggle"
                    checked={showStamp}
                    onChange={(e) => setShowStamp(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <label htmlFor="stamp-toggle" className="text-xs font-bold text-gray-800 cursor-pointer">
                    Apply Official Stamp
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
                  <input
                    type="checkbox"
                    id="sign-toggle"
                    checked={showSignature}
                    onChange={(e) => setShowSignature(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <label htmlFor="sign-toggle" className="text-xs font-bold text-gray-800 cursor-pointer">
                    Apply Calligraphic Signature
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Invoice Details Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Invoice Details Table
                </h3>
                <button
                  type="button"
                  onClick={addInvoiceRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>

              <div className="space-y-3">
                {invoiceDetails.map((inv, idx) => (
                  <div key={inv.id || idx} className="p-3 border rounded-xl bg-gray-50/70 space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => removeInvoiceRow(idx)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Invoice #</label>
                        <input
                          type="text"
                          value={inv.invoiceNo}
                          onChange={(e) => {
                            const u = [...invoiceDetails];
                            u[idx].invoiceNo = e.target.value;
                            setInvoiceDetails(u);
                          }}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Package Details</label>
                        <input
                          type="text"
                          value={inv.packageDetails}
                          onChange={(e) => {
                            const u = [...invoiceDetails];
                            u[idx].packageDetails = e.target.value;
                            setInvoiceDetails(u);
                          }}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Fees Details</label>
                        <input
                          type="text"
                          value={inv.feesDetails}
                          onChange={(e) => {
                            const u = [...invoiceDetails];
                            u[idx].feesDetails = e.target.value;
                            setInvoiceDetails(u);
                          }}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Due Fee ({currency})</label>
                        <input
                          type="number"
                          value={inv.dueFee}
                          onChange={(e) => {
                            const u = [...invoiceDetails];
                            u[idx].dueFee = Number(e.target.value) || 0;
                            setInvoiceDetails(u);
                          }}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Received Fee ({currency})</label>
                        <input
                          type="number"
                          value={inv.receivedFee}
                          onChange={(e) => {
                            const u = [...invoiceDetails];
                            u[idx].receivedFee = Number(e.target.value) || 0;
                            setInvoiceDetails(u);
                          }}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 6: Installments Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Installment Payments Table
                </h3>
                <button
                  type="button"
                  onClick={addInstallmentRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80"
                >
                  <Plus className="w-4 h-4" /> Add Installment Row
                </button>
              </div>

              <div className="space-y-3">
                {installments.map((inst, idx) => (
                  <div key={inst.id || idx} className="p-3 border rounded-xl bg-gray-50/70 space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => removeInstallmentRow(idx)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Due Date</label>
                        <input
                          type="text"
                          value={inst.dueDate}
                          onChange={(e) => updateInstallment(idx, "dueDate", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Invoice #</label>
                        <input
                          type="text"
                          value={inst.invoiceNo}
                          onChange={(e) => updateInstallment(idx, "invoiceNo", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Due Fee</label>
                        <input
                          type="number"
                          value={inst.dueFee}
                          onChange={(e) => updateInstallment(idx, "dueFee", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Received Fee</label>
                        <input
                          type="number"
                          value={inst.receivedFee}
                          onChange={(e) => updateInstallment(idx, "receivedFee", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Balance Fee</label>
                        <input
                          type="number"
                          value={inst.balanceFee}
                          onChange={(e) => updateInstallment(idx, "balanceFee", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Payment Details</label>
                        <input
                          type="text"
                          value={inst.paymentDetails}
                          onChange={(e) => updateInstallment(idx, "paymentDetails", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 7: Institution Customization Accordion */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setShowCompanySettings(!showCompanySettings)}
                className="w-full flex items-center justify-between text-left font-bold text-gray-900 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" /> Institution Header Settings &amp; Policies
                </span>
                {showCompanySettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCompanySettings && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Institution Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={companyTagline}
                        onChange={(e) => setCompanyTagline(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PAN / Tax ID</label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN / Reg ID</label>
                      <input
                        type="text"
                        value={gstinNumber}
                        onChange={(e) => setGstinNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Terms &amp; Conditions</label>
                    <textarea
                      rows={4}
                      value={termsText}
                      onChange={(e) => setTermsText(e.target.value)}
                      className="w-full p-2.5 text-xs border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Policy Link URL</label>
                    <input
                      type="text"
                      value={policyUrl}
                      onChange={(e) => setPolicyUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. SIGNED DOCUMENT SHEET (RECEIPT & PAYMENT STATEMENT) PREVIEW COMES LATER */}
          <div className="space-y-3 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                  Signed Document Sheet (Receipt &amp; Payment Statement)
                </h2>
              </div>
              <span className="text-xs text-gray-500 italic">
                A4 Attached Format · Live updates as you edit above
              </span>
            </div>

            {/* Document Display Canvas */}
            <div className="bg-gray-100 border border-gray-300 rounded-3xl p-4 sm:p-8 flex justify-center shadow-inner overflow-x-auto">
              <ReceiptPreview receipt={currentReceiptObject} previewRef={previewRef} scale={1} />
            </div>
          </div>
        </div>
      )}

      {/* ===================== SEND EMAIL MODAL WITH LIVE PREVIEW ===================== */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Review &amp; Send Official Receipt PDF
                  </h3>
                  <p className="text-xs text-gray-500">
                    Verify the signed receipt document below before delivering it to the payer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details & Information Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2 text-sm border-2 border-emerald-500/40 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex flex-col justify-center">
                <p>
                  <strong>Invoice ID:</strong> {invoiceId}
                </p>
                <p>
                  <strong>Amount:</strong> {currency} {Number(receivedFee).toLocaleString()}
                </p>
              </div>
            </div>

            {/* LIVE PREVIEW OF THE DOCUMENT INSIDE THE MODAL */}
            <div className="flex-1 min-h-[300px] overflow-y-auto bg-gray-100 rounded-2xl border p-4 shadow-inner">
              <div className="text-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-white/80 px-3 py-1 rounded-full shadow-xs">
                  Exact Signed Receipt Document to be attached
                </span>
              </div>
              <div className="flex justify-center transform scale-[0.78] origin-top sm:scale-[0.88] md:scale-[0.95]">
                <ReceiptPreview receipt={currentReceiptObject} previewRef={modalPreviewRef} />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t shrink-0">
              <p className="text-xs text-gray-400">
                Attachment: Payment_Receipt_{invoiceId || receiptNo}.pdf
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendEmail}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50 transition"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Delivering Receipt...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Confirm &amp; Send to Payer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
