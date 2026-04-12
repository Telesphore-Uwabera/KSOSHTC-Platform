import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getApiBase } from "@/lib/apiBase";
import { Certificate } from "@/components/Certificate";
import { Loader2, ShieldCheck, AlertCircle, Home, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function CertificateVerification() {
  const { id } = useParams();

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ["certificate", id],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/certificates/${id}`);
      if (!res.ok) throw new Error("Certificate not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: curriculumData, isLoading: modulesLoading } = useQuery({
    queryKey: ["curriculum", id],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/certificates/${id}/curriculum`);
      if (!res.ok) throw new Error("Failed to load curriculum");
      return res.json();
    },
    enabled: !!cert,
  });

  const handleDownload = () => {
    const printContent = document.getElementById("certificate-print-area");
    if (!printContent) return;

    const printArea = printContent.outerHTML;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${cert.learnerName}</title>
          <style>
            @media print {
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; }
              #certificate-print-area { border: none !important; box-shadow: none !important; width: 1122px; height: 793px; }
            }
            body { margin: 0; display: flex; justify-content: center; align-items: flex-start; background: #fff; }
          </style>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printArea}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f9fa]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-medium text-gray-600">Verifying certificate...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Certificate</h1>
        <p className="text-lg text-gray-600 max-w-md mb-8">
          The certificate ID provided could not be verified in our records. Please contact KSOHTC for assistance.
        </p>
        <Link to="/">
          <Button variant="outline" size="lg">
            <Home className="mr-2 h-5 w-5" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-20 overflow-x-hidden">
      <div className="bg-[#004d40] text-white py-12 px-4 shadow-lg mb-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
             <ShieldCheck className="h-16 w-16 text-[#004d40]" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black tracking-tight mb-1 uppercase">Certificate Verified</h1>
            <p className="text-green-100 text-lg opacity-90">This is an authentic Kigali Safety OSH Training Center certificate.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownload} className="bg-white text-[#004d40] hover:bg-white/90 font-bold shadow-lg">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto p-4 flex flex-col items-center w-full">
        
        {/* Responsive Certificate Container */}
        <div className="w-full flex justify-center overflow-hidden mb-6">
           <div style={{ 
             width: '1122px', 
             height: '793px',
             transformOrigin: 'top center',
           }} className="transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 transition-transform duration-300">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <Certificate data={cert} />
              </div>
           </div>
        </div>

        {/* Height adjustment to pull content up (replaces the ghost space logic) */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 639px) { .responsive-cert-spacer { margin-top: -540px; } }
          @media (min-width: 640px) and (max-width: 767px) { .responsive-cert-spacer { margin-top: -380px; } }
          @media (min-width: 768px) and (max-width: 1023px) { .responsive-cert-spacer { margin-top: -220px; } }
          @media (min-width: 1024px) { .responsive-cert-spacer { margin-top: 0px; } }
        `}} />
        
        <div className="responsive-cert-spacer w-full h-1" />

        <div className="w-full max-w-5xl bg-white shadow-2xl rounded-sm border border-gray-200 p-8 sm:p-12 mb-12">
          {/* Transcript Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-100 pb-8 mb-8 gap-6">
            <div className="flex items-center gap-4">
              <img src="/logo.webp" alt="KSOSHTC Logo" className="h-16 w-auto object-contain" />
              <div>
                <h2 className="text-3xl font-black text-[#004d40] tracking-tighter uppercase leading-none">KSOSHTC</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Occupational Safety & Health Training</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Official Student Transcript</h1>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Student Name</Label>
                <div className="text-xl font-black text-[#004d40] uppercase">{cert.learnerName}</div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {cert.learnerName} has successfully completed the required professional development certificate programs and courses listed below. These accomplishments demonstrate continued academic excellence and a commitment to occupational safety and health.
              </p>
            </div>
            <div className="border-l border-gray-100 pl-8 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Number</span>
                <span className="font-mono font-bold text-gray-900">{cert.certificateId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enrollment Date</span>
                <span className="font-bold text-gray-900">{format(new Date(cert.createdAt || cert.dateIssued), "MM/dd/yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Main Programs Table */}
          <div className="mb-12">
            <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-900 pb-1 mb-4">Professional Certificate Program</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                    <th className="py-2 px-4">Program Title</th>
                    <th className="py-2 px-4 text-center">Hours</th>
                    <th className="py-2 px-4 text-center">Score</th>
                    <th className="py-2 px-4 text-center">GPA</th>
                    <th className="py-2 px-4 text-right">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b font-bold text-gray-800">
                    <td className="py-3 px-4">{cert.courses}</td>
                    <td className="py-3 px-4 text-center">{cert.totalHours || "120"}</td>
                    <td className="py-3 px-4 text-center">{cert.averageScore || "90"}</td>
                    <td className="py-3 px-4 text-center">{cert.gpa || "3.60"}</td>
                    <td className="py-3 px-4 text-right">{format(new Date(cert.dateIssued), "MM/dd/yyyy")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Courses Table */}
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-900 pb-1 mb-4">Course Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                    <th className="py-2 px-4">Course Title</th>
                    <th className="py-2 px-4 text-center">Score</th>
                    <th className="py-2 px-4 text-center">Issue Date</th>
                    <th className="py-2 px-4 text-center">Hours</th>
                    <th className="py-2 px-4 text-right">Note</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {cert.transcript && cert.transcript.length > 0 ? (
                    cert.transcript.map((item: any, idx: number) => (
                      <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-2.5 px-4 font-bold text-gray-700">{item.title}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-gray-900">{item.score}</td>
                        <td className="py-2.5 px-4 text-center text-gray-500 font-medium">
                          {format(new Date(item.date || cert.dateIssued), "MM/dd/yyyy")}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-gray-800">{item.hours}</td>
                        <td className="py-2.5 px-4 text-right text-gray-400 text-[10px] uppercase font-bold italic">{item.note || ""}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic">No detailed course breakdown available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-16 text-center border-t border-gray-100 pt-8 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default select-none">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em]">Kigali Safety OSH Training Center - Official Verification Document</p>
          </div>
        </div>
      </div>
    </div>
  );
}
