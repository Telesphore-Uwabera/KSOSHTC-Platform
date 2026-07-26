import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit3, Download, Eye, FileText, Check, AlertCircle, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QuotationPreview } from "../../components/admin/QuotationPreview";
import type { Quotation, QuotationModule, QuotationTrainer } from "@shared/api";
import { FIXED_PAYMENT_INFO, FIXED_MOTTO } from "@shared/api";
import { getAdminSessionToken } from "@/lib/adminApi";

const DEFAULT_MODULES: QuotationModule[] = [
  {
    id: "mod-1",
    title: "Introduction to Occupational Health & Safety",
    bullets: ["HSE principles", "Rights and responsibilities", "Safety culture"],
  },
  {
    id: "mod-2",
    title: "Hazard Identification & Risk Assessment",
    bullets: ["Hazard categories", "Risk assessment process", "Control measures"],
  },
  {
    id: "mod-3",
    title: "Fire Safety & Emergency Preparedness",
    bullets: ["Fire prevention", "Fire extinguishers", "Evacuation procedures", "Emergency response"],
  },
  {
    id: "mod-4",
    title: "Slips, Trips and Falls Prevention",
    bullets: ["Causes", "Prevention measures", "Housekeeping standards"],
  },
  {
    id: "mod-5",
    title: "Manual Handling & Ergonomics",
    bullets: ["Safe lifting", "Carrying luggage", "Housekeeping ergonomics"],
  },
  {
    id: "mod-6",
    title: "Personal Protective Equipment (PPE)",
    bullets: ["Types of PPE", "Selection and use", "Maintenance"],
  },
  {
    id: "mod-7",
    title: "Hazard Communication",
    bullets: ["GHS symbols", "Labels", "Safety Data Sheets (SDS)", "Employee Right-to-Know"],
  },
  {
    id: "mod-8",
    title: "Chemical and Biological Hazards",
    bullets: [
      "Cleaning chemicals",
      "Chemical exposure routes",
      "Storage and handling",
      "Blood-borne pathogens",
      "Mold and fungi",
      "Bacteria and viruses",
      "Waste handling",
      "Spill response",
    ],
  },
  {
    id: "mod-9",
    title: "Incident Reporting & Accident Investigation",
    bullets: ["Near misses", "Incident reporting", "Root cause analysis", "Corrective actions"],
  },
  {
    id: "mod-10",
    title: "Inspection",
    bullets: [
      "Workplace inspection procedures",
      "Inspection checklist development",
      "Reporting findings",
      "Corrective action follow-up",
    ],
  },
];

const DEFAULT_TRAINERS: QuotationTrainer[] = [
  {
    id: "tr-1",
    name: "Emmanuel NIYOBUHUNGIRO",
    title: "HSE Specialist - HSE Trainer - Kigali Safety OSH Training Center",
    bio: "HSE Professional with over 4 years of experience in Occupational Health, Safety, Emergency and Disaster Management.",
    certifications:
      "IOSH Managing Safely, OSHA Manager, OSHA Specialist, OSHA Train the Trainer (ToT), ISO 45001:2018, ISO 19011:2018, First Aid.",
  },
  {
    id: "tr-2",
    name: "Jacques Roger NIYONTEZE",
    title: "HSSE Professional",
    bio: "Over 7 years of experience in energy, infrastructure, mining and industrial projects. Specialist in risk assessment, emergency response, incident investigation, auditing, and environmental management.",
    certifications:
      "Environmental & Social Risk Management (World Bank Group), Oil & Gas Safety - Train the Trainer, OSHA General Industry, OSHA OSH Specialist, ISO 45001:2018, ISO 19011:2018, First Aid.",
  },
];

const DEFAULT_METHODOLOGY = [
  "Classroom-based learning",
  "Practical demonstrations",
  "Group discussions",
  "Case studies",
  "Interactive exercises",
];

const DEFAULT_FEE_INCLUDED = [
  "Professional Training Delivery",
  "Training Materials",
  "Practical Sessions",
  "Certificate of Competence",
];

const DEFAULT_PAYMENT_TERMS = ["50% before training", "50% after training"];

const DEFAULT_ADDITIONAL_INFO = [
  "Tax is included.",
  "After payment, EBM invoice will be provided.",
  "Training materials, practical sessions, and certification are included.",
];

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toLocaleDateString("en-GB"));
  const [quotationNo, setQuotationNo] = useState("KSOSHTC/0426/FA-AWR");
  const [clientName, setClientName] = useState("Kigali Safety OSH Training Center");
  const [location, setLocation] = useState("Kigali");
  const [numberOfParticipants, setNumberOfParticipants] = useState<number>(10);
  const [costPerPerson, setCostPerPerson] = useState<number>(200000);
  const [duration, setDuration] = useState("5 Days");
  const [preparedByName, setPreparedByName] = useState("Jackson DUSABIMANA");
  const [preparedByTitle, setPreparedByTitle] = useState("Director - KSOSHTC");

  const [modules, setModules] = useState<QuotationModule[]>(DEFAULT_MODULES);
  const [trainers, setTrainers] = useState<QuotationTrainer[]>(DEFAULT_TRAINERS);

  const [trainingMethodologyText, setTrainingMethodologyText] = useState(DEFAULT_METHODOLOGY.join("\n"));
  const [includedInFeeText, setIncludedInFeeText] = useState(DEFAULT_FEE_INCLUDED.join("\n"));
  const [paymentTermsText, setPaymentTermsText] = useState(DEFAULT_PAYMENT_TERMS.join("\n"));
  const [additionalInfoText, setAdditionalInfoText] = useState(DEFAULT_ADDITIONAL_INFO.join("\n"));

  const previewRef = useRef<HTMLDivElement>(null);

  // Calculated total cost
  const totalCost = (Number(numberOfParticipants) || 0) * (Number(costPerPerson) || 0);

  const token = getAdminSessionToken();

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotations", {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      } else {
        setError("Failed to fetch quotations.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching quotations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toLocaleDateString("en-GB"));
    setQuotationNo(`KSOSHTC/${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getFullYear()).slice(-2)}/FA-001`);
    setClientName("Kigali Safety OSH Training Center");
    setLocation("Kigali");
    setNumberOfParticipants(10);
    setCostPerPerson(200000);
    setDuration("5 Days");
    setPreparedByName("Jackson DUSABIMANA");
    setPreparedByTitle("Director - KSOSHTC");
    setModules(DEFAULT_MODULES);
    setTrainers(DEFAULT_TRAINERS);
    setTrainingMethodologyText(DEFAULT_METHODOLOGY.join("\n"));
    setIncludedInFeeText(DEFAULT_FEE_INCLUDED.join("\n"));
    setPaymentTermsText(DEFAULT_PAYMENT_TERMS.join("\n"));
    setAdditionalInfoText(DEFAULT_ADDITIONAL_INFO.join("\n"));
  };

  const handleCreateNew = () => {
    resetForm();
    setActiveTab("form");
  };

  const handleEdit = (q: Quotation) => {
    setEditingId(q.id);
    setDate(q.date);
    setQuotationNo(q.quotationNo);
    setClientName(q.clientName);
    setLocation(q.location);
    setNumberOfParticipants(q.numberOfParticipants);
    setCostPerPerson(q.costPerPerson);
    setDuration(q.duration);
    setPreparedByName(q.preparedBy?.name || "Jackson DUSABIMANA");
    setPreparedByTitle(q.preparedBy?.title || "Director - KSOSHTC");
    setModules(q.modules || DEFAULT_MODULES);
    setTrainers(q.trainers || DEFAULT_TRAINERS);
    setTrainingMethodologyText((q.trainingMethodology || DEFAULT_METHODOLOGY).join("\n"));
    setIncludedInFeeText((q.includedInFee || DEFAULT_FEE_INCLUDED).join("\n"));
    setPaymentTermsText((q.paymentTerms || DEFAULT_PAYMENT_TERMS).join("\n"));
    setAdditionalInfoText((q.additionalInfo || DEFAULT_ADDITIONAL_INFO).join("\n"));
    setActiveTab("form");
  };

  const currentQuotationObject: Quotation = {
    id: editingId || "draft",
    quotationNo,
    date,
    clientName,
    location,
    numberOfParticipants,
    costPerPerson,
    totalCost,
    duration,
    paymentInfo: FIXED_PAYMENT_INFO,
    modules,
    trainingMethodology: trainingMethodologyText.split("\n").filter((s) => s.trim().length > 0),
    includedInFee: includedInFeeText.split("\n").filter((s) => s.trim().length > 0),
    paymentTerms: paymentTermsText.split("\n").filter((s) => s.trim().length > 0),
    additionalInfo: additionalInfoText.split("\n").filter((s) => s.trim().length > 0),
    trainers,
    preparedBy: {
      name: preparedByName,
      title: preparedByTitle,
    },
    motto: FIXED_MOTTO,
    createdAt: new Date().toISOString(),
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !location) {
      alert("Client name and location are required.");
      return;
    }

    try {
      const payload = currentQuotationObject;
      const url = editingId ? `/api/quotations/${editingId}` : "/api/quotations";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchQuotations();
        setActiveTab("list");
        alert(editingId ? "Quotation updated successfully!" : "Quotation saved successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save quotation.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error saving quotation.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      if (res.ok) {
        setQuotations(quotations.filter((q) => q.id !== id));
      } else {
        alert("Failed to delete quotation.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting quotation.");
    }
  };

  const downloadPdf = async (qToRender?: Quotation) => {
    setIsGeneratingPdf(true);
    try {
      const targetElement = previewRef.current;
      if (!targetElement) {
        alert("Preview element not found.");
        setIsGeneratingPdf(false);
        return;
      }

      const clientNameStr = qToRender?.clientName || clientName || "Client";
      const docTitle = `Quotation of ${clientNameStr}`;

      // Create temporary printable iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        setIsGeneratingPdf(false);
        return;
      }

      // Collect all active styles from the parent document
      const headStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map((node) => node.outerHTML)
        .join("\n");

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTitle}</title>
            ${headStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #print-wrapper {
                width: 100% !important;
                max-width: 210mm !important;
                margin: 0 auto !important;
                background: #ffffff !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              #print-wrapper > div {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                width: 100% !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
            </style>
          </head>
          <body>
            <div id="print-wrapper">
              ${targetElement.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to trigger print.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper functions for updating modules & trainers in form
  const addModule = () => {
    setModules([
      ...modules,
      {
        id: `mod-${Date.now()}`,
        title: "New Training Module Title",
        bullets: ["Point 1", "Point 2"],
      },
    ]);
  };

  const updateModuleTitle = (idx: number, title: string) => {
    const next = [...modules];
    next[idx].title = title;
    setModules(next);
  };

  const updateModuleBullets = (idx: number, bulletsStr: string) => {
    const next = [...modules];
    next[idx].bullets = bulletsStr.split("\n").filter((b) => b.trim().length > 0);
    setModules(next);
  };

  const removeModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const addTrainer = () => {
    setTrainers([
      ...trainers,
      {
        id: `tr-${Date.now()}`,
        name: "Trainer Name",
        title: "Trainer Title",
        bio: "Trainer Bio",
        certifications: "Certifications",
      },
    ]);
  };

  const updateTrainer = (idx: number, field: keyof QuotationTrainer, val: string) => {
    const next = [...trainers];
    next[idx] = { ...next[idx], [field]: val };
    setTrainers(next);
  };

  const removeTrainer = (idx: number) => {
    setTrainers(trainers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#15532c]" /> Quotations & Proformas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Create, manage, and download client training proformas as PDF.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "form" ? (
            <button
              onClick={() => setActiveTab("list")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm transition"
            >
              Back to List
            </button>
          ) : (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-[#15532c] text-white rounded-xl font-semibold hover:bg-[#103f21] text-sm flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "list" ? (
        /* List View */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Loading quotations...
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-3">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold">No quotations created yet.</p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-[#15532c] text-white rounded-xl font-semibold hover:bg-[#103f21] text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Quotation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-[11px] tracking-wider bg-gray-50/50">
                    <th className="py-3 px-4">Quotation No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Participants</th>
                    <th className="py-3 px-4">Total Cost</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{q.quotationNo}</td>
                      <td className="py-3.5 px-4 text-gray-600">{q.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{q.clientName}</td>
                      <td className="py-3.5 px-4 text-gray-600">{q.location}</td>
                      <td className="py-3.5 px-4 text-gray-600">{q.numberOfParticipants}</td>
                      <td className="py-3.5 px-4 font-bold text-[#15532c]">
                        {q.totalCost?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FRW
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setViewingQuotation(q);
                            handleEdit(q);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Form Top & Live Preview Beneath Layout */
        <div className="space-y-8">
          {/* Top Section: Form Controls */}
          <div className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingId ? "Edit Quotation" : "Create New Quotation"}
              </h2>
              <button
                type="button"
                onClick={() => downloadPdf()}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-[#1b365d] text-white rounded-xl font-semibold hover:bg-[#132845] text-xs flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-sm">
              {/* Header Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-[#15532c]">
                  Header & Client Info
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Quotation No</label>
                    <input
                      type="text"
                      value={quotationNo}
                      onChange={(e) => setQuotationNo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Client Name *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Kigali Safety OSH Training Center"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Kigali"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Participants</label>
                    <input
                      type="number"
                      min={1}
                      value={numberOfParticipants}
                      onChange={(e) => setNumberOfParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cost Per Person (FRW)</label>
                    <input
                      type="number"
                      min={0}
                      value={costPerPerson}
                      onChange={(e) => setCostPerPerson(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 5 Days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                </div>

                {/* Total Cost Display */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-emerald-900">
                  <span className="font-semibold text-xs">Calculated Total Cost:</span>
                  <span className="font-extrabold text-base">
                    {totalCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FRW
                  </span>
                </div>
              </div>

              {/* Fixed Payment Info Banner */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-1">
                <div className="font-bold text-gray-800 uppercase flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Bank Payment Info (Fixed)
                </div>
                <p className="text-gray-600">
                  Bank: <b>EQUITY BANK RWANDA</b> | Acc: <b>4025201372795</b> | Name: <b>Kigali Safety OSH Training Center</b>
                </p>
              </div>

              {/* Dynamic Training Modules */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-[#15532c]">
                    Training Modules ({modules.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addModule}
                    className="text-xs text-[#15532c] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Module
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {modules.map((mod, idx) => (
                    <div key={mod.id || idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 bg-[#15532c] text-white text-[10px] font-bold rounded flex items-center justify-center">
                            {idx + 1}
                          </span>
                          Module #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeModule(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Module Title</label>
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => updateModuleTitle(idx, e.target.value)}
                          placeholder="Module Title"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                          Bulleted Description (one item per line)
                        </label>
                        <textarea
                          rows={2}
                          value={mod.bullets.join("\n")}
                          onChange={(e) => updateModuleBullets(idx, e.target.value)}
                          placeholder="Bullet points (one per line)"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg font-mono text-gray-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Sub-Footer Information Sections */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-[#15532c]">
                  Additional Terms & Methodology
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Training Methodology (one item per line)
                    </label>
                    <textarea
                      rows={3}
                      value={trainingMethodologyText}
                      onChange={(e) => setTrainingMethodologyText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Included in the Training Fee (one item per line)
                    </label>
                    <textarea
                      rows={3}
                      value={includedInFeeText}
                      onChange={(e) => setIncludedInFeeText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payment Terms (one item per line)
                    </label>
                    <textarea
                      rows={3}
                      value={paymentTermsText}
                      onChange={(e) => setPaymentTermsText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Additional Information (one item per line)
                    </label>
                    <textarea
                      rows={3}
                      value={additionalInfoText}
                      onChange={(e) => setAdditionalInfoText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#15532c] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Trainers */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-[#15532c]">
                    Trainers ({trainers.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addTrainer}
                    className="text-xs text-[#15532c] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Trainer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trainers.map((tr, idx) => (
                    <div key={tr.id || idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-gray-800">Trainer #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeTrainer(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Trainer Full Name</label>
                          <input
                            type="text"
                            value={tr.name}
                            onChange={(e) => updateTrainer(idx, "name", e.target.value)}
                            placeholder="e.g. Emmanuel NIYOBUHUNGIRO"
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Trainer Title / Position</label>
                          <input
                            type="text"
                            value={tr.title}
                            onChange={(e) => updateTrainer(idx, "title", e.target.value)}
                            placeholder="e.g. HSE Specialist"
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg italic"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Trainer Bio / Profile Summary</label>
                        <textarea
                          rows={2}
                          value={tr.bio}
                          onChange={(e) => updateTrainer(idx, "bio", e.target.value)}
                          placeholder="Bio description"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Trainer Certifications</label>
                        <input
                          type="text"
                          value={tr.certifications}
                          onChange={(e) => updateTrainer(idx, "certifications", e.target.value)}
                          placeholder="e.g. IOSH Managing Safely, OSHA Manager..."
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prepared By & Motto */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-[#15532c]">
                  Prepared By
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={preparedByName}
                      onChange={(e) => setPreparedByName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={preparedByTitle}
                      onChange={(e) => setPreparedByTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs">
                  <span className="font-bold text-[#15532c]">Motto: </span>
                  <span className="italic">Safety today, prosperity tomorrow.</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#15532c] text-white rounded-xl font-bold hover:bg-[#103f21] shadow-sm transition"
                >
                  {editingId ? "Update Quotation" : "Save Quotation"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Section: Live Document Preview */}
          <div className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#15532c]" /> Live PDF Document Preview
              </span>
              <button
                onClick={() => downloadPdf()}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-[#15532c] text-white rounded-xl text-xs font-bold hover:bg-[#103f21] inline-flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>

            <div className="border border-gray-300 rounded-3xl shadow-lg overflow-hidden bg-gray-200 p-4 sm:p-6 flex justify-center">
              <QuotationPreview quotation={currentQuotationObject} containerRef={previewRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
